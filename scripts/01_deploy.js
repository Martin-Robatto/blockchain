const { ethers } = require("hardhat");

async function main() {
	const deployer = await ethers.getSigner();
	console.log('\n\n');
	console.log("=".repeat(30));
	console.log("DEPLOY PROCESS STARTED");
	console.log("=".repeat(30));
	console.log('\n\n');
    console.log("Deployer address: ", deployer.address);
	console.log("Deployer initial balance: ", ethers.utils.formatEther(await deployer.getBalance()));
	console.log('\n\n');
	console.log("Deploying contract: Proxy...");
	const proxyFactory = await ethers.getContractFactory("Proxy", deployer);
	proxyInstance = await proxyFactory.deploy();
    console.log("Proxy address: ", proxyInstance.address);
	await proxyInstance.deployed();
	console.log("");
	console.log("Deploying contract: SmartInvestment...");
	const smartInvestmentFactory = await ethers.getContractFactory("SmartInvestment", deployer);
	smartInvestmentInstance = await smartInvestmentFactory.deploy();
    console.log("SmartInvestment address: ", smartInvestmentInstance.address);
	await smartInvestmentInstance.deployed();
	console.log("");
	console.log("Linking SmartInvestment and Proxy...");
	await proxyInstance.setImplementation(smartInvestmentInstance.address);
	console.log('\n\n');
    console.log("Deployer final balance: ", ethers.utils.formatEther(await deployer.getBalance()));
	console.log('\n\n');
	console.log("=".repeat(30));
	console.log("DEPLOY PROCESS FINISHED SUCCESSFULLY");
	console.log("=".repeat(30));
	console.log('\n\n');
}

main()
.then(() => process.exit(0))
.catch((error) => {
	console.error(error);
	process.exit(1);
});
