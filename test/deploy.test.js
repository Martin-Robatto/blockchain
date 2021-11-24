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
        const [owner, maker1, maker2, maker3, auditor1, auditor2] = await ethers.getSigners();
        await contractInstance.addMaker(maker1.address, "Pepote", "Pepota", "1234");
        await contractInstance.addMaker(maker2.address, "Pepito", "PepitoLandia", "123");
        await contractInstance.addMaker(maker3.address, "Pepolla", "PepollaLandia", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await contractInstance.openSubmissionPeriod();
        await contractInstance.connect(maker1).addInvestmentProposal("Proposal1", "aDescription", 50);
        const proposalAddress = await contractInstance.proposals(0);
        const proposal = await contractInstance.proposalsAttributes(proposalAddress);
        expect("Proposal1").to.be.equal(proposal.name);
    });

    it("Vote for proposal test", async function() {
        const [owner, maker1, maker2, maker3, auditor1, auditor2, voter1] = await ethers.getSigners();
        await contractInstance.addMaker(maker1.address, "Pepote", "Pepota", "1234");
        await contractInstance.addMaker(maker2.address, "Pepito", "PepitoLandia", "123");
        await contractInstance.addMaker(maker3.address, "Pepolla", "PepollaLandia", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await contractInstance.openSubmissionPeriod();
        await contractInstance.connect(maker1).addInvestmentProposal("Proposal1", "aDescription1", 5);
        const proposalToVote = await contractInstance.proposals(0);
        await contractInstance.connect(maker2).addInvestmentProposal("Proposal2", "aDescription2", 5);
        await contractInstance.connect(auditor1).verifyProposal(proposalToVote);
        await contractInstance.openVotingPeriod();
        await contractInstance.connect(voter1).voteForProposal(proposalToVote, {
            value: ethers.utils.parseEther("50.0")
        }); 
        const proposalsAttributes = await contractInstance.proposalsAttributes(proposalToVote);
        expect(parseInt(1)).to.be.equal(parseInt(proposalsAttributes.totalVotes));
    });

    it("Retrieve Winner event from blockchain", async function() {
        const [owner, maker1, maker2, maker3, auditor1, auditor2, voter1, voter2] = await ethers.getSigners();
        await contractInstance.addMaker(maker1.address, "Pepote", "Pepota", "1234");
        await contractInstance.addMaker(maker2.address, "Pepito", "PepitoLandia", "123");
        await contractInstance.addMaker(maker3.address, "Pepolla", "PepollaLandia", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
        await contractInstance.openSubmissionPeriod();
        await contractInstance.connect(maker1).addInvestmentProposal("Proposal1", "aDescription1", 5);
        const proposalToVote1 = await contractInstance.proposals(0);
        await contractInstance.connect(maker2).addInvestmentProposal("Proposal2", "aDescription2", 5);
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
        await contractInstance.connect(auditor1).authorizeClosingPeriod();
        await contractInstance.connect(auditor2).authorizeClosingPeriod();
        await contractInstance.openNeutralPeriod();
        const eventFilter = contractInstance.filters.Winner();      
        let abi = [
            "event Winner(string indexed _name, address indexed _maker, uint256 _minRequiredInvestment, string _investmentProposal)"
        ];
        let iface = new ethers.utils.Interface(abi)
        await ethers.provider.getLogs(eventFilter).then((logs) => {
            logs.forEach(async (log) => {
                var proposal = iface.parseLog(log).args[3];
                console.log(`Name: ${proposal}`);
                var makerAddress = iface.parseLog(log).args[1];
                var maker = await contractInstance.makersAttributes(makerAddress);
                console.log(`Maker: ${maker.name}`);
                var minRequiredInvestment = parseInt(iface.parseLog(log).args[2]);
                console.log(`Min Required Investment: ${minRequiredInvestment}`);
                console.log();
            });
        });
    });
});