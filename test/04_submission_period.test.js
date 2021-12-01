const { expect } = require("chai");
const { ethers } = require("hardhat");

let contractInstance;
let owner, maker1, maker2, maker3, auditor1, auditor2, auditor3, voter1, voter2;

beforeEach(async function() { 
    const contractFactory = await ethers.getContractFactory("SmartInvestment");
	contractInstance = await contractFactory.deploy(); 
    [owner, maker1, maker2, maker3, auditor1, auditor2, auditor3, voter1, voter2] = await ethers.getSigners();
});

describe("Add investment proposal", async function() {
    beforeEach(async function() {
        await contractInstance.addMaker(maker1.address, "Maker 1", "UY", "123");
        await contractInstance.addMaker(maker2.address, "Maker 2", "AR", "123");
        await contractInstance.addMaker(maker3.address, "Maker 3", "BR", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await contractInstance.openSubmissionPeriod();
    });

    it("Investment proposal amount should be 0 initially", async function() {
        const amount = await contractInstance.proposalsAmount();
        expect(0).to.be.equal(amount);
    });

    it("Investment proposal amount should be 1 after adding a new one", async function() {
        const proposalName = "Proposal 1"; 
        const proposalDescription = "Description 1";
        const proposalRequiredInvestment = 5;

        await contractInstance.connect(maker1).addInvestmentProposal(proposalName, proposalDescription, proposalRequiredInvestment);

        const amount = await contractInstance.proposalsAmount();
        expect(1).to.be.equal(amount);
    });

	it("Investment proposal attributes should be stored successfully", async function() {
        const proposalName = "Proposal 1"; 
        const proposalDescription = "Description 1";
        const proposalRequiredInvestment = 5;

        await contractInstance.connect(maker1).addInvestmentProposal(proposalName, proposalDescription, proposalRequiredInvestment);

        const proposalAddress = await contractInstance.proposals(0);
        const proposalInstance = await ethers.getContractAt("InvestmentProposal", proposalAddress);
        expect(proposalName).to.be.equal(await proposalInstance.name());
        expect(proposalDescription).to.be.equal(await proposalInstance.description());
        expect(proposalRequiredInvestment).to.be.equal(await proposalInstance.minRequiredInvestment());
    });

    it("Add investment proposal without authorization should be reverted", async function() {
        const proposalName = "Proposal 1"; 
        const proposalDescription = "Description 1";
        const proposalRequiredInvestment = 5;

        await expect(
            contractInstance.connect(auditor1).addInvestmentProposal(proposalName, proposalDescription, proposalRequiredInvestment)
        ).to.be.revertedWith('Not authorized');
        await expect(
            contractInstance.connect(voter1).addInvestmentProposal(proposalName, proposalDescription, proposalRequiredInvestment)
        ).to.be.revertedWith('Not authorized');
    });
});

describe("Verify investment proposal", async function() {
    let proposalToVote;

    beforeEach(async function() {
        await contractInstance.addMaker(maker1.address, "Maker 1", "UY", "123");
        await contractInstance.addMaker(maker2.address, "Maker 2", "AR", "123");
        await contractInstance.addMaker(maker3.address, "Maker 3", "BR", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await contractInstance.openSubmissionPeriod();
        await contractInstance.connect(maker1).addInvestmentProposal("Proposal 1", "Description 1", 5);
        await contractInstance.connect(maker2).addInvestmentProposal("Proposal 2", "Description 2", 5);
        proposalToVote = await contractInstance.proposals(0);       
    });

    it("Investment proposal verified should be false initially", async function() {
        const proposalAttributes = await contractInstance.proposalsAttributes(proposalToVote); 
        expect(false).to.be.equal(proposalAttributes.verified);
    });

    it("Investment proposal verified should be true after adding a new verification", async function() {
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote);
        const proposalAttributes = await contractInstance.proposalsAttributes(proposalToVote); 
        expect(true).to.be.equal(proposalAttributes.verified);
    });

    it("Verify proposal without authorization should be reverted", async function() {
        await expect(
            contractInstance.connect(maker1).verifyProposal(proposalToVote)
        ).to.be.revertedWith('Not authorized');
        await expect(
            contractInstance.connect(voter1).verifyProposal(proposalToVote)
        ).to.be.revertedWith('Not authorized');
    });
});

describe("Open Voting Period", async function() {
    beforeEach(async function() {
        await contractInstance.addMaker(maker1.address, "Maker 1", "UY", "123");
        await contractInstance.addMaker(maker2.address, "Maker 2", "AR", "123");
        await contractInstance.addMaker(maker3.address, "Maker 3", "BR", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await contractInstance.openSubmissionPeriod();
    });

    it("Open voting period without authorization should be reverted", async function() {
        await contractInstance.connect(maker1).addInvestmentProposal("Proposal 1", "Description 1", 5);
        await contractInstance.connect(maker2).addInvestmentProposal("Proposal 2", "Description 2", 5);
        const proposalToVote1 = await contractInstance.proposals(0);
        const proposalToVote2 = await contractInstance.proposals(1);
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote1);
        await contractInstance.connect(auditor2).verifyProposal(proposalToVote2);
        await expect(contractInstance.connect(maker1).openVotingPeriod()).to.be.revertedWith('Not authorized');
        await expect(contractInstance.connect(auditor1).openVotingPeriod()).to.be.revertedWith('Not authorized');
    });
    
    it("Open voting period without enough proposals should be reverted", async function() {
        await contractInstance.connect(maker1).addInvestmentProposal("Proposal 1", "Description 1", 5);
        const proposalToVote1 = await contractInstance.proposals(0);
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote1);
        await expect(contractInstance.openVotingPeriod()).to.be.revertedWith('Not enough investment proposals');
    });

    it("Open voting period with enough proposals should be successful", async function() {
        await contractInstance.connect(maker1).addInvestmentProposal("Proposal 1", "Description 1", 5);
        await contractInstance.connect(maker2).addInvestmentProposal("Proposal 2", "Description 2", 5);
        const proposalToVote1 = await contractInstance.proposals(0);
        const proposalToVote2 = await contractInstance.proposals(1);
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote1);
        await contractInstance.connect(auditor2).verifyProposal(proposalToVote2);
        await contractInstance.openVotingPeriod();
        expect(2).to.be.equal(await contractInstance.actualPeriod());
    });
});