/* eslint-disable camelcase */

import { expect } from 'chai';
import { ethers } from 'hardhat';

import { MaybePay__factory } from '../typechain-types';

describe('MaybePay', () => {
  async function Fixture() {
    const [, consumer, serviceProvider] = await ethers.getSigners();

    const MaybePay = await ethers.getContractFactory('MaybePay');
    const maybePay = await MaybePay.deploy();

    return {
      consumer,
      serviceProvider,
      maybePay,
      expectApproxEth: async (address: string, expectedEthBalance: number) => {
        const actual = Number(
          ethers.utils.formatEther(await ethers.provider.getBalance(address)),
        );

        expect(actual).to.be.closeTo(expectedEthBalance, 0.01);
      },
      consumerToMaybePay: MaybePay__factory.connect(maybePay.address, consumer),
      serviceProviderToMaybePay: MaybePay__factory.connect(
        maybePay.address,
        serviceProvider,
      ),
    };
  }

  it('should be able to deposit funds and withdraw them', async () => {
    const fx = await Fixture();

    await fx.expectApproxEth(fx.consumer.address, 10000);

    await (
      await fx.consumer.sendTransaction({
        to: fx.maybePay.address,
        value: ethers.utils.parseEther('1.0'),
      })
    ).wait();

    await fx.expectApproxEth(fx.consumer.address, 9999);

    await (
      await fx.consumerToMaybePay.withdraw(ethers.utils.parseEther('1.0'))
    ).wait();

    await fx.expectApproxEth(fx.consumer.address, 10000);
  });

  // eslint-disable-next-line max-len
  it("should allow service provider to claim consumer's funds with correct message", async () => {
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

    const consumerSignature = await fx.consumer.signMessage(
      ethers.utils.solidityKeccak256(
        ['uint', 'address', 'uint', 'address', 'uint', 'uint', 'uint'],
        [
          ethers.provider.network.chainId,
          fx.maybePay.address,
          amount,
          fx.serviceProvider.address,
          serverSecretHash,
          consumerMixer,
          threshold,
        ],
      ),
    );

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

    // Up from 10000.0
    await fx.expectApproxEth(fx.serviceProvider.address, 10000.1);
  });
});
