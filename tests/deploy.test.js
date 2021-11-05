const { expect } = require("chai");
const { ethers } = require("hardhat");

let contractInstance;

// se ejecuta antes que todos los test
before(async function() { 
    console.log("deploy process started");
	const deployer = await ethers.getSigner();
    console.log("address: ", deployer.address);
	console.log("deployer balance: ", ethers.utils.formatEther(await deployer.getBalance()));
	const contractFactory = await ethers.getContractFactory("MyDeployContract", deployer);
	contractInstance = await contractFactory.deploy();
    console.log("contract deployed to address: ", contractInstance.address);
    console.log("deployer balance: ", ethers.utils.formatEther(await deployer.getBalance()));
    console.log("deploy process finished");
});

describe("Deploy Test", async function() {
	it("Contract should be deployed successfully", async function() {
		expect(contractInstance).to.be.ok;
    });
});
