const { expect } = require("chai");
const { ethers } = require("hardhat");

let contractInstance;

before(async function() { 
    console.log("deploy process started");
    const contractFactory = await ethers.getContractFactory("SmartInvestment");
	contractInstance = await contractFactory.deploy();
    console.log("contract deployed to address: ", contractInstance.address);
    console.log("deploy process finished");
});

describe("Deploy Test", async function() {
	it("Contract should be deployed successfully", async function() {
		expect(contractInstance).to.be.ok;
    });
});

describe("Investment proposal test", async function() {
	it("Add investment proposal", async function() {
        const contractFactory = await ethers.getContractFactory("Proxy");
	    proxy = await contractFactory.deploy();
        const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
        await contractInstance.addMaker(addr1.address, "Pepote", "Pepota", "1234");
        await contractInstance.addMaker(addr2.address, "Pepito", "PepitoLandia", "123");
        await contractInstance.addMaker(addr3.address, "Pepolla", "PepollaLandia", "123");
        await contractInstance.addAuditor(addr4.address);
        await contractInstance.addAuditor(addr5.address);
        await contractInstance.openSubmissionPeriod();
        await contractInstance.connect(addr1).addInvestmentProposal("Proposal1", "aDescription", 50);
        const proposalAddress = await contractInstance.proposals(0);
        const proposal = await contractInstance.proposalsAttributes(proposalAddress);
        expect("Proposal1").to.be.equal(proposal.name);
    });
});