import { BigNumber } from 'ethers';
import type { ethers as ethersTypes } from 'ethers';
import { ethers } from 'hardhat';
import { hexlify } from 'ethers/lib/utils';

// eslint-disable-next-line camelcase
import { MaybePay, MaybePay__factory } from './typechain-types';

type MaybePaymentRequest = {
  type: 'maybe-payment-request';
  message: {
    type: 'maybe-payment-request-message';
    effectiveAmount: string;
    serviceProvider: string;
    serverSecretHash: string;
    chainId: number;
    maybePay: string;
  };
  serverSecret: BigNumber;
};

type MaybePayment = {
  type: 'maybe-payment';
  chainId: number;
  maybePay: string;
  amountIfTriggered: string;
  serviceProvider: string;
  consumer: string;
  serverSecretHash: string;
  consumerMixer: string;
  threshold: string;
  consumerSignature: Signature;
};

type Signature = {
  r: string;
  s: string;
  v: number;
};

export function MaybePaymentRequest(
  /**
   * ETH in wei units
   *
   * This is the effective amount being requested - the discrete payment (if
   * triggered) can be any amount larger than this, at the choice of the user.
   */
  effectiveAmount: BigNumber,

  /** Address of who to pay (likely your address) */
  serviceProvider: string,

  chainId: number,
  maybePay: string,

  serverSecret = BigNumber.from(ethers.utils.randomBytes(32)),
): MaybePaymentRequest {
  const serverSecretHash = ethers.utils.solidityKeccak256(
    ['uint'],
    [serverSecret],
  );

  return {
    type: 'maybe-payment-request',
    message: {
      type: 'maybe-payment-request-message',
      effectiveAmount: effectiveAmount.toHexString(),
      serviceProvider,
      serverSecretHash,
      chainId,
      maybePay,
    },
    serverSecret,
  };
}

/**
 * Sign a message appropriately for MaybePay
 * (.signMessage will interpret a hex string as an ordinary string and doesn't
 * split into r,s,v which we need)
 *
 * To verify these signatures use .callStatic.verifySignature on the MaybePay
 * contract you get from connect().
 */
export async function sign(
  messageHash: string,
  signer: ethersTypes.Signer,
): Promise<Signature> {
  const signatureBytes = await signer.signMessage(
    Buffer.from(messageHash.slice(2), 'hex'),
  );

  return {
    r: signatureBytes.slice(0, 66),
    s: `0x${signatureBytes.slice(66, 130)}`,
    v: parseInt(signatureBytes.slice(130, 132), 16),
  };
}

export async function MaybePayment(
  effectiveAmount: BigNumber,
  serviceProvider: string,
  serverSecretHash: string,
  amountIfTriggered: BigNumber,
  chainId: number,
  maybePay: string,
  consumerSigner: ethersTypes.Signer,
): Promise<MaybePayment> {
  if (amountIfTriggered.lt(effectiveAmount)) {
    throw new Error(
      [
        'Amount if triggered must be greater than or equal to the effective',
        'amount',
      ].join(' '),
    );
  }

  const consumerMixer = BigNumber.from(ethers.utils.randomBytes(32));

  let thresholdBigint =
    (2n ** 256n * effectiveAmount.toBigInt()) / amountIfTriggered.toBigInt();

  if (thresholdBigint > uint256Max) {
    thresholdBigint = uint256Max;
  }

  const threshold = BigNumber.from(thresholdBigint);

  return {
    type: 'maybe-payment',
    chainId,
    maybePay,
    amountIfTriggered: amountIfTriggered.toHexString(),
    serviceProvider,
    consumer: await consumerSigner.getAddress(),
    serverSecretHash,
    consumerMixer: hexlify(consumerMixer),
    threshold: threshold.toHexString(),
    consumerSignature: await sign(
      MaybePaymentMessageHash(
        chainId,
        maybePay,
        amountIfTriggered,
        serviceProvider,
        serverSecretHash,
        consumerMixer,
        threshold,
      ),
      consumerSigner,
    ),
  };
}

export function MaybePaymentMessageHash(
  chainId: number,
  maybePay: string,
  amountIfTriggered: BigNumber,
  serviceProvider: string,
  serverSecretHash: string,
  consumerMixer: BigNumber,
  threshold: BigNumber,
) {
  return ethers.utils.solidityKeccak256(
    ['uint', 'address', 'uint', 'address', 'bytes32', 'uint', 'uint'],
    [
      chainId,
      maybePay,
      amountIfTriggered,
      serviceProvider,
      serverSecretHash,
      consumerMixer,
      threshold,
    ],
  );
}

export async function checkMaybePayment(
  maybePaymentRequest: MaybePaymentRequest,
  maybePayment: MaybePayment,
  maybePay: MaybePay,
) {
  const invalidReasons: string[] = [];

  if (maybePay.address !== maybePaymentRequest.message.maybePay) {
    throw new Error("MaybePay contract doesn't match address in request");
  }

  if (
    (await maybePay.provider.getNetwork()).chainId !==
    maybePaymentRequest.message.chainId
  ) {
    throw new Error(
      "MaybePay contract chainId doesn't match chainId in request",
    );
  }

  let effectiveAmountBigInt =
    ((BigInt(maybePayment.threshold) + 1n) *
      BigInt(maybePayment.amountIfTriggered)) /
    2n ** 256n;

  const claimedEffectiveAmount = BigNumber.from(effectiveAmountBigInt);

  if (
    effectiveAmountBigInt < BigInt(maybePaymentRequest.message.effectiveAmount)
  ) {
    invalidReasons.push('Effective amount lower than requested');
  }

  if (maybePayment.maybePay !== maybePaymentRequest.message.maybePay) {
    invalidReasons.push("maybePay address in payment doesn't match request");
    effectiveAmountBigInt = 0n;
  }

  if (maybePayment.chainId !== maybePaymentRequest.message.chainId) {
    invalidReasons.push("chainId in payment doesn't match request");
    effectiveAmountBigInt = 0n;
  }

  const signedCorrectly = await maybePay.callStatic.verifySignature(
    maybePayment.consumer,
    MaybePaymentMessageHash(
      maybePayment.chainId,
      maybePayment.maybePay,
      BigNumber.from(maybePayment.amountIfTriggered),
      maybePayment.serviceProvider,
      maybePayment.serverSecretHash,
      BigNumber.from(maybePayment.consumerMixer),
      BigNumber.from(maybePayment.threshold),
    ),
    maybePayment.consumerSignature,
  );

  if (!signedCorrectly) {
    invalidReasons.push('Not signed correctly');
    effectiveAmountBigInt = 0n;
  }

  const consumerBalance = await maybePay.provider.getBalance(
    maybePayment.consumer,
  );

  if (consumerBalance.lt(maybePayment.amountIfTriggered)) {
    invalidReasons.push('Insufficient funds');
    effectiveAmountBigInt = 0n;
  }

  const sharedRandomNumber =
    (maybePaymentRequest.serverSecret.toBigInt() +
      BigInt(maybePayment.consumerMixer)) %
    uint256Modulus;

  return {
    claimedEffectiveAmount,
    effectiveAmount: BigNumber.from(effectiveAmountBigInt),
    amountIfTriggered: maybePayment.amountIfTriggered,
    triggeredAmount: BigNumber.from(
      sharedRandomNumber <= BigInt(maybePayment.threshold)
        ? maybePayment.amountIfTriggered
        : 0,
    ),
    invalidReasons,
  };
}

export function connect(
  address: string,
  signerOrProvider: ethersTypes.Signer | ethersTypes.providers.Provider,
) {
  // eslint-disable-next-line camelcase
  return MaybePay__factory.connect(address, signerOrProvider);
}

const uint256Modulus = 2n ** 256n;
const uint256Max = 2n ** 256n - 1n;
