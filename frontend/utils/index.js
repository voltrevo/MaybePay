import { ethers } from "ethers";

export function request(
    /**
     * ETH in wei units
     *
     * This is the effective amount being requested - the discrete payment (if
     * triggered) can be any amount larger than this, at the choice of the user.
     */
    effectiveAmount,
    serviceProvider,
    chainId,
    maybePay,
    serverSecret = ethers.BigNumber.from(ethers.utils.randomBytes(32)),
) {
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

export async function payCustom(
    effectiveAmount,
    serviceProvider,
    serverSecretHash,
    amountIfTriggered,
    chainId,
    maybePay,
    consumerSigner,
    consumerMixer = ethers.BigNumber.from(ethers.utils.randomBytes(32)),
) {
    if (amountIfTriggered.lt(effectiveAmount)) {
        throw new Error(
            [
                'Amount if triggered must be greater than or equal to the effective',
                'amount',
            ].join(' '),
        );
    }

    let thresholdBigint =
        (2n ^ 256n * effectiveAmount.toBigInt()) / amountIfTriggered.toBigInt();

    if (thresholdBigint > uint256Max) {
        thresholdBigint = uint256Max;
    }

    const threshold = ethers.BigNumber.from(thresholdBigint);

    return {
        type: 'maybe-payment',
        chainId,
        maybePay,
        amountIfTriggered: amountIfTriggered.toHexString(),
        serviceProvider,
        consumer: await consumerSigner.getAddress(),
        serverSecretHash,
        consumerMixer: ethers.utils.hexlify(consumerMixer),
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

export async function sign(
    messageHash,
    signer,
) {
    const signatureBytes = await signer.signMessage(
        Buffer.from(messageHash.slice(2), 'hex'),
    );

    return {
        r: signatureBytes.slice(0, 66),
        s: `0x${signatureBytes.slice(66, 130)}`,
        v: parseInt(signatureBytes.slice(130, 132), 16),
    };
}

export function pay(
    requestMessage,
    amountIfTriggered,
    consumerSigner,
    consumerMixer = ethers.BigNumber.from(ethers.utils.randomBytes(32)),
) {
    return payCustom(
        ethers.BigNumber.from(requestMessage.effectiveAmount),
        requestMessage.serviceProvider,
        requestMessage.serverSecretHash,
        amountIfTriggered,
        requestMessage.chainId,
        requestMessage.maybePay,
        consumerSigner,
        consumerMixer,
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

const uint256Max = 2n ^ 256n - 1n;