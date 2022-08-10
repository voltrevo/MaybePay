import { ethers } from "ethers"

export function MaybePaymentMessageHash(
    chainId,
    maybePay,
    amountIfTriggered,
    serviceProvider,
    serverSecretHash,
    consumerMixer,
    threshold,
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

export async function check(
    maybePaymentRequest,
    maybePayment,
    maybePay,
) {
    const invalidReasons = [];

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
        2n ^ 256n;

    const claimedEffectiveAmount = ethers.BigNumber.from(effectiveAmountBigInt);

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

    if (
        maybePayment.serviceProvider !== maybePaymentRequest.message.serviceProvider
    ) {
        invalidReasons.push('Signed payment does not go to the correct address');
        effectiveAmountBigInt = 0n;
    }

    if (
        maybePayment.serverSecretHash !==
        maybePaymentRequest.message.serverSecretHash
    ) {
        invalidReasons.push("serverSecretHash in payment doesn't match request");
        effectiveAmountBigInt = 0n;
    }

    const signedCorrectly = await maybePay.callStatic.verifySignature(
        maybePayment.consumer,
        MaybePaymentMessageHash(
            maybePayment.chainId,
            maybePayment.maybePay,
            ethers.BigNumber.from(maybePayment.amountIfTriggered),
            maybePayment.serviceProvider,
            maybePayment.serverSecretHash,
            ethers.BigNumber.from(maybePayment.consumerMixer),
            ethers.BigNumber.from(maybePayment.threshold),
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
        (ethers.BigNumber.from(maybePaymentRequest.serverSecret.hex).toBigInt() +
            BigInt(maybePayment.consumerMixer)) %
        uint256Modulus;

    return {
        claimedEffectiveAmount,
        effectiveAmount: ethers.BigNumber.from(effectiveAmountBigInt),
        amountIfTriggered: maybePayment.amountIfTriggered,
        triggeredAmount: ethers.BigNumber.from(
            sharedRandomNumber <= BigInt(maybePayment.threshold)
                ? maybePayment.amountIfTriggered
                : 0,
        ),
        invalidReasons,
    };
}

const uint256Modulus = 2n ** 256n;