const { expect } = require("chai");
const { ethers } = require("hardhat");

let contractInstance;

beforeEach(async function() { 
    const contractFactory = await ethers.getContractFactory("SmartInvestment");
	contractInstance = await contractFactory.deploy();
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

    it("Vote for proposal test", async function() {
        const [owner, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();

        await contractInstance.addMaker(addr1.address, "Pepote", "Pepota", "1234");
        await contractInstance.addMaker(addr2.address, "Pepito", "PepitoLandia", "123");
        await contractInstance.addMaker(addr3.address, "Pepolla", "PepollaLandia", "123");
        await contractInstance.addAuditor(addr4.address);
        await contractInstance.addAuditor(addr5.address);
        await contractInstance.openSubmissionPeriod();
        await contractInstance.connect(addr1).addInvestmentProposal("Proposal1", "aDescription1", 5);
        const proposalToVote = await contractInstance.proposals(0);
        console.log(await addr6.getBalance()/1e18);
        await contractInstance.connect(addr2).addInvestmentProposal("Proposal2", "aDescription2", 5);
        await contractInstance.connect(addr4).verifyProposal(proposalToVote);
        await contractInstance.openVotingPeriod();
        await contractInstance.connect(addr6).voteForProposal(proposalToVote, {
            value: ethers.utils.parseEther("50.0")
        }); 
        const proposalAtributos = await contractInstance.proposalsAttributes(proposalToVote);
        console.log(await addr6.getBalance()/1e18);
        expect(parseInt(1)).to.be.equal(parseInt(proposalAtributos.totalVotes));
    });
});