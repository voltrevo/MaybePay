import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

import * as MaybePayLib from '../MaybePayLib';

describe('MaybePay', () => {
  async function Fixture() {
    const [admin, otherSigner] = await ethers.getSigners();

    const consumer = ethers.Wallet.createRandom().connect(ethers.provider);
    const serviceProvider = ethers.Wallet.createRandom().connect(
      ethers.provider,
    );

    await admin.sendTransaction({
      to: consumer.address,
      value: ethers.utils.parseEther('100.0'),
    });

    await admin.sendTransaction({
      to: serviceProvider.address,
      value: ethers.utils.parseEther('100.0'),
    });

    const MaybePay = await ethers.getContractFactory('MaybePay');
    const maybePay = await MaybePay.deploy();

    return {
      consumer,
      serviceProvider,
      otherSigner,
      maybePay,
      expectApproxEth: async (address: string, expectedEthBalance: number) => {
        const actual = Number(
          ethers.utils.formatEther(await ethers.provider.getBalance(address)),
        );

        expect(actual).to.be.closeTo(expectedEthBalance, 0.01);
      },
      consumerToMaybePay: MaybePayLib.connect(maybePay.address, consumer),
      serviceProviderToMaybePay: MaybePayLib.connect(
        maybePay.address,
        serviceProvider,
      ),
    };
  }

  it('should perform happy path', async () => {
    const fx = await Fixture();

    await (
      await fx.consumer.sendTransaction({
        to: fx.maybePay.address,
        value: ethers.utils.parseEther('1.0'),
      })
    ).wait();

    expect(
      ethers.utils.formatEther(
        await fx.consumerToMaybePay.balances(fx.consumer.address),
      ),
    ).to.eq('1.0');

    const paymentRequest = MaybePayLib.request(
      ethers.utils.parseEther('0.000001'),
      fx.serviceProvider.address,
      ethers.provider.network.chainId,
      fx.maybePay.address,
      BigNumber.from(5),
    );

    const payment = await MaybePayLib.pay(
      paymentRequest.message,
      ethers.utils.parseEther('0.1'),
      fx.consumer,
      BigNumber.from(2),
    );

    const checkResult = await MaybePayLib.check(
      paymentRequest,
      payment,
      fx.serviceProviderToMaybePay,
    );

    expect(
      checkResult.claimedEffectiveAmount.gte(
        paymentRequest.message.effectiveAmount,
      ),
    ).to.eq(true);

    expect(checkResult.triggeredAmount).to.deep.eq(
      ethers.utils.parseEther('0.1'),
    );

    await (
      await MaybePayLib.claim(
        paymentRequest,
        payment,
        fx.serviceProviderToMaybePay,
      )
    ).wait();

    expect(
      ethers.utils.formatEther(
        await fx.consumerToMaybePay.balances(fx.consumer.address),
      ),
    ).to.eq('0.9'); // Down from 1.0

    // Up from 100.0
    await fx.expectApproxEth(fx.serviceProvider.address, 100.1);
  });

  it('should be able to deposit funds and withdraw them', async () => {
    const fx = await Fixture();

    await fx.expectApproxEth(fx.consumer.address, 100);

    await (
      await fx.consumer.sendTransaction({
        to: fx.maybePay.address,
        value: ethers.utils.parseEther('1.0'),
      })
    ).wait();

    await fx.expectApproxEth(fx.consumer.address, 99);

    await (
      await fx.consumerToMaybePay.withdraw(ethers.utils.parseEther('1.0'))
    ).wait();

    await fx.expectApproxEth(fx.consumer.address, 100);
  });

  it('should verify valid signature', async () => {
    const fx = await Fixture();

    const messageHash = ethers.utils.solidityKeccak256(['uint'], [37]);
    const signature = await MaybePayLib.sign(messageHash, fx.consumer);

    const valid = await fx.consumerToMaybePay.callStatic.verifySignature(
      fx.consumer.address,
      messageHash,
      signature,
    );

    expect(valid).to.eq(true);
  });

  // eslint-disable-next-line max-len
  it("should allow service provider to claim consumer's funds with correct message", async () => {
    // Note: This is pretty much the same as the happy path, but without using
    // MaybePayLib

    const fx = await Fixture();

    await (
      await fx.consumer.sendTransaction({
        to: fx.maybePay.address,
        value: ethers.utils.parseEther('1.0'),
      })
    ).wait();

    expect(
      ethers.utils.formatEther(
        await fx.consumerToMaybePay.balances(fx.consumer.address),
      ),
    ).to.eq('1.0');

    const amount = ethers.utils.parseEther('0.1');
    const serverSecret = 5;
    const consumerMixer = 2;
    const threshold = 10;

    const serverSecretHash = ethers.utils.solidityKeccak256(
      ['uint'],
      [serverSecret],
    );

    const wrappedMessageHash = Buffer.from(
      ethers.utils
        .solidityKeccak256(
          ['uint', 'address', 'uint', 'address', 'bytes32', 'uint', 'uint'],
          [
            ethers.provider.network.chainId,
            fx.maybePay.address,
            amount,
            fx.serviceProvider.address,
            serverSecretHash,
            consumerMixer,
            threshold,
          ],
        )
        .slice(2),
      'hex',
    );

    const consumerSignatureBytes = await fx.consumer.signMessage(
      wrappedMessageHash,
    );

    const consumerSignature = {
      r: consumerSignatureBytes.slice(0, 66),
      s: `0x${consumerSignatureBytes.slice(66, 130)}`,
      v: parseInt(consumerSignatureBytes.slice(130, 132), 16),
    };

    await (
      await fx.serviceProviderToMaybePay.claim(
        amount,
        fx.consumer.address,
        serverSecret,
        consumerMixer,
        threshold,
        consumerSignature,
      )
    ).wait();

    expect(
      ethers.utils.formatEther(
        await fx.consumerToMaybePay.balances(fx.consumer.address),
      ),
    ).to.eq('0.9'); // Down from 1.0

    // Up from 100.0
    await fx.expectApproxEth(fx.serviceProvider.address, 100.1);
  });

  it('should reject claim signed by a different unrelated signer', async () => {
    const fx = await Fixture();

    await (
      await fx.consumer.sendTransaction({
        to: fx.maybePay.address,
        value: ethers.utils.parseEther('1.0'),
      })
    ).wait();

    expect(
      ethers.utils.formatEther(
        await fx.consumerToMaybePay.balances(fx.consumer.address),
      ),
    ).to.eq('1.0');

    const amount = ethers.utils.parseEther('0.1');
    const serverSecret = 5;
    const consumerMixer = 2;
    const threshold = 10;

    const serverSecretHash = ethers.utils.solidityKeccak256(
      ['uint'],
      [serverSecret],
    );

    const messageHash = MaybePayLib.MaybePaymentMessageHash(
      ethers.provider.network.chainId,
      fx.maybePay.address,
      amount,
      fx.serviceProvider.address,
      serverSecretHash,
      BigNumber.from(consumerMixer),
      BigNumber.from(threshold),
    );

    const consumerSignature = await MaybePayLib.sign(
      messageHash,
      fx.otherSigner,
    );

    try {
      await fx.serviceProviderToMaybePay.claim(
        amount,
        fx.consumer.address,
        serverSecret,
        consumerMixer,
        threshold,
        consumerSignature,
      );

      expect(true).to.eq(false, '.claim should have thrown');
    } catch (error) {
      expect((error as Error).message).to.contain(
        'Signature verification failed',
      );
    }
  });
});
