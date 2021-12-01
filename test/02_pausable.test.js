const { expect } = require("chai");
const { ethers } = require("hardhat");

let contractInstance;
let owner, maker1, maker2, maker3, auditor1, auditor2, auditor3, voter1, voter2;

beforeEach(async function() { 
    const contractFactory = await ethers.getContractFactory("SmartInvestment");
	contractInstance = await contractFactory.deploy(); 
    [owner, maker1, maker2, maker3, auditor1, auditor2, auditor3, voter1, voter2] = await ethers.getSigners();
});

describe("Pausable", async function() {
	it("Interact with contract in pause should be reverted", async function() {
        await contractInstance.setPause(true);
		await expect(
            contractInstance.withdraw(0)
        ).to.be.revertedWith('Contract is in Pause');
    });
});