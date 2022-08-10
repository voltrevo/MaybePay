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
});
