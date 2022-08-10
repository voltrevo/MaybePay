import { expect } from 'chai';
import { ethers } from 'hardhat';

describe("MaybePay contract", function () {
  it("Contract should receive ether and owner should withdraw ether", async function () {
    const [owner] = await ethers.getSigners();

    const MaybePay = await ethers.getContractFactory("MaybePay");

    const maybepay = await MaybePay.deploy();

    const transactionHash = await owner.sendTransaction({
      to: maybepay.address,
      value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
    });
    console.log("Owner contains " + ethers.utils.formatEther(await maybepay.balances(owner.address)) + " ethers")

    await maybepay.withdraw(ethers.utils.parseEther("0.5"))
    console.log("Owner contains " + ethers.utils.formatEther(await maybepay.balances(owner.address)) + " ethers")
  });
});