const { ethers } = require("hardhat");

async function main() {
	console.log("deploy process started");
	const deployer = await ethers.getSigner();
    console.log("address: ", deployer.address);
	console.log("deployer balance: ", ethers.utils.formatEther(await deployer.getBalance()));
	const contractFactory = await ethers.getContractFactory("Test", deployer);
	contractInstance = await contractFactory.deploy();
    console.log("contract deployed to address: ", contractInstance.address);
    console.log("deployer balance: ", ethers.utils.formatEther(await deployer.getBalance()));
    console.log("deploy process finished");
}

main()
.then(() => process.exit(0))
.catch((error) => {
	console.error(error);
	process.exit(1);
});
