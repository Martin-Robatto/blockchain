const { ethers } = require("hardhat");

async function main() {
	const deployer = await ethers.getSigner();
    console.log("Deployer address: ", deployer.address);
	console.log("Deployer Balance: ", ethers.utils.formatEther(await deployer.getBalance()));
	console.log("");
	console.log("Deploying contract: Proxy...");
	const proxyFactory = await ethers.getContractFactory("Proxy", deployer);
	proxyInstance = await proxyFactory.deploy();
    console.log("Proxy address: ", proxyInstance.address);
	console.log("Deploying contract: SmartInvestment...");
	const smartInvestmentFactory = await ethers.getContractFactory("SmartInvestment", deployer);
	smartInvestmentInstance = await smartInvestmentFactory.deploy();
    console.log("SmartInvestment address: ", smartInvestmentInstance.address);
	console.log("");
    console.log("Deployer Balance: ", ethers.utils.formatEther(await deployer.getBalance()));
}

main()
.then(() => process.exit(0))
.catch((error) => {
	console.error(error);
	process.exit(1);
});
