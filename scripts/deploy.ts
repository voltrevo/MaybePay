import { ethers } from 'hardhat';

async function main() {
  const MaybePay = await ethers.getContractFactory('MaybePay');
  const maybepay = await MaybePay.deploy();

  await maybepay.deployed();

  console.log('MaybePay deployed to ' + maybepay.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
