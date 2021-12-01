const { expect } = require("chai");
const { ethers } = require("hardhat");

let contractInstance;
let owner, maker1, maker2, maker3, auditor1, auditor2, auditor3, voter1, voter2;

beforeEach(async function() { 
    const contractFactory = await ethers.getContractFactory("SmartInvestment");
	contractInstance = await contractFactory.deploy(); 
    [owner, maker1, maker2, maker3, auditor1, auditor2, auditor3, voter1, voter2] = await ethers.getSigners();
});

describe("Vote for proposal", async function() {
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

    it("Investment proposal votes should be 0 initially", async function() {
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote);
        await contractInstance.openVotingPeriod();
        const proposalAttributes = await contractInstance.proposalsAttributes(proposalToVote); 
        expect(0).to.be.equal(parseInt(proposalAttributes.totalVotes));
    });

    it("Investment proposal votes should be 1 after adding a new one", async function() {
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote);
        await contractInstance.openVotingPeriod();
        await contractInstance.connect(voter1).voteForProposal(proposalToVote, {
            value: ethers.utils.parseEther("5.0")
        }); 
        const proposalAttributes = await contractInstance.proposalsAttributes(proposalToVote); 
        expect(1).to.be.equal(parseInt(proposalAttributes.totalVotes));
    });

    it("Vote for proposal without enough amount to vote should be reverted", async function() {
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote);
        await contractInstance.openVotingPeriod();
        await expect(
            contractInstance.connect(voter1).voteForProposal(proposalToVote, {
                value: ethers.utils.parseEther("4.0")
            })
        ).to.be.revertedWith('Not enough amount to vote');
    });

    it("Vote for proposal without verification should be reverted", async function() {
        await contractInstance.openVotingPeriod();
        await expect(
            contractInstance.connect(voter1).voteForProposal(proposalToVote, {
                value: ethers.utils.parseEther("4.0")
            })
        ).to.be.revertedWith('Proposal is not verified');
    });

    it("Vote for proposal without authorization should be reverted", async function() {
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote);
        await contractInstance.openVotingPeriod();
        await expect(
            contractInstance.connect(maker1).voteForProposal(proposalToVote, {
                value: ethers.utils.parseEther("5.0")
            })
        ).to.be.revertedWith('Not authorized');
        await expect(
            contractInstance.connect(auditor1).voteForProposal(proposalToVote, {
                value: ethers.utils.parseEther("5.0")
            })
        ).to.be.revertedWith('Not authorized');
    });
});

describe("Authorize for close voting period", async function() {
    beforeEach(async function() {
        await contractInstance.addMaker(maker1.address, "Maker 1", "UY", "123");
        await contractInstance.addMaker(maker2.address, "Maker 2", "AR", "123");
        await contractInstance.addMaker(maker3.address, "Maker 3", "BR", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await contractInstance.addAuditor(auditor3.address);
        await contractInstance.openSubmissionPeriod();
        await contractInstance.connect(maker1).addInvestmentProposal("Proposal 1", "Description 1", 5);
        await contractInstance.connect(maker2).addInvestmentProposal("Proposal 2", "Description 2", 5);
        const proposalToVote1 = await contractInstance.proposals(0);
        const proposalToVote2 = await contractInstance.proposals(1);
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote1);
        await contractInstance.connect(auditor2).verifyProposal(proposalToVote2);
        await contractInstance.openVotingPeriod();
        await contractInstance.connect(voter1).voteForProposal(proposalToVote1, {
            value: ethers.utils.parseEther("10.0")
        }); 
        await contractInstance.connect(voter2).voteForProposal(proposalToVote2, {
            value: ethers.utils.parseEther("40.0")
        });
    });

    it("Close Voting Period Votes should be 0 initially", async function() {
        expect(0).to.be.equal(await contractInstance.closeVotingPeriodVotesAmount());
    });

    it("Close Voting Period Votes should be 1 after adding a new one", async function() {
        await contractInstance.connect(auditor1).authorizeClosingPeriod();
        expect(1).to.be.equal(await contractInstance.closeVotingPeriodVotesAmount());
    });

    it("Vote twice for Close Voting Period should be reverted", async function() {
        await contractInstance.connect(auditor1).authorizeClosingPeriod();
        await expect(
            contractInstance.connect(auditor1).authorizeClosingPeriod()
        ).to.be.revertedWith('The auditor has already authorized');
    });

    it("Vote more than twice for Close Voting Period should be reverted because there are already enough authorizations", async function() {
        await contractInstance.connect(auditor1).authorizeClosingPeriod();
        await contractInstance.connect(auditor2).authorizeClosingPeriod();
        await expect(
            contractInstance.connect(auditor3).authorizeClosingPeriod()
        ).to.be.revertedWith('There are enough authorizations for closing voting period');
    });

    it("Vote for Close Voting Period without authorization should be reverted", async function() {
        await expect(
            contractInstance.connect(maker1).authorizeClosingPeriod()
        ).to.be.revertedWith('Not authorized');
        await expect(
            contractInstance.connect(voter1).authorizeClosingPeriod()
        ).to.be.revertedWith('Not authorized');
    });
});

describe("Open Neutral Period", async function() {
    let proposalToVote1;
    let proposalToVote2;

    beforeEach(async function() {
        await contractInstance.addMaker(maker1.address, "Maker 1", "UY", "123");
        await contractInstance.addMaker(maker2.address, "Maker 2", "AR", "123");
        await contractInstance.addMaker(maker3.address, "Maker 3", "BR", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await contractInstance.openSubmissionPeriod();
        await contractInstance.connect(maker1).addInvestmentProposal("Proposal 1", "Description 1", 5);
        await contractInstance.connect(maker2).addInvestmentProposal("Proposal 2", "Description 2", 5);
        proposalToVote1 = await contractInstance.proposals(0);
        proposalToVote2 = await contractInstance.proposals(1);
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote1);
        await contractInstance.connect(auditor2).verifyProposal(proposalToVote2);
        await contractInstance.openVotingPeriod();
    });
    
    it("Open neutral period without authorization should be reverted", async function() {
        await contractInstance.connect(voter1).voteForProposal(proposalToVote1, {
            value: ethers.utils.parseEther("10.0")
        }); 
        await contractInstance.connect(voter2).voteForProposal(proposalToVote2, {
            value: ethers.utils.parseEther("40.0")
        });
        await contractInstance.connect(auditor1).authorizeClosingPeriod();
        await contractInstance.connect(auditor2).authorizeClosingPeriod();
        await expect(contractInstance.connect(maker1).openNeutralPeriod()).to.be.revertedWith('Not authorized');
        await expect(contractInstance.connect(auditor1).openNeutralPeriod()).to.be.revertedWith('Not authorized');
    });
    
    it("Open neutral period without enough auditors authorizations should be reverted", async function() {
        await contractInstance.connect(voter1).voteForProposal(proposalToVote1, {
            value: ethers.utils.parseEther("10.0")
        }); 
        await contractInstance.connect(voter2).voteForProposal(proposalToVote2, {
            value: ethers.utils.parseEther("40.0")
        });
        await expect(contractInstance.openNeutralPeriod()).to.be.revertedWith('Not enough authorizations for closing voting period');
    });

    it("Open neutral period without enough proposals total balance should be reverted", async function() {
        await contractInstance.connect(auditor1).authorizeClosingPeriod();
        await contractInstance.connect(auditor2).authorizeClosingPeriod();
        await expect(contractInstance.openNeutralPeriod()).to.be.revertedWith('Total balance is not enough');
    });

    it("Open neutral period with the requirements fulfilled should be successful", async function() {
        await contractInstance.connect(voter1).voteForProposal(proposalToVote1, {
            value: ethers.utils.parseEther("10.0")
        }); 
        await contractInstance.connect(voter2).voteForProposal(proposalToVote2, {
            value: ethers.utils.parseEther("40.0")
        });
        await contractInstance.connect(auditor1).authorizeClosingPeriod();
        await contractInstance.connect(auditor2).authorizeClosingPeriod();
        await contractInstance.openNeutralPeriod();
        expect(0).to.be.equal(await contractInstance.actualPeriod());
    });
});