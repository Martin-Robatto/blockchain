const { expect } = require("chai");
const { ethers } = require("hardhat");

let contractInstance;
let owner, maker1, maker2, maker3, auditor1, auditor2, auditor3, voter1, voter2;

beforeEach(async function() { 
    const contractFactory = await ethers.getContractFactory("SmartInvestment");
	contractInstance = await contractFactory.deploy(); 
    [owner, maker1, maker2, maker3, auditor1, auditor2, auditor3, voter1, voter2] = await ethers.getSigners();
});

describe("Retrieve Winner event from Blockchain", async function() {
    beforeEach(async function() {
        await contractInstance.addMaker(maker1.address, "Maker 1", "UY", "123");
        await contractInstance.addMaker(maker2.address, "Maker 2", "AR", "123");
        await contractInstance.addMaker(maker3.address, "Maker 3", "BR", "123");
        await contractInstance.addAuditor(auditor1.address);
        await contractInstance.addAuditor(auditor2.address);
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
        await contractInstance.connect(auditor1).authorizeClosingPeriod();
        await contractInstance.connect(auditor2).authorizeClosingPeriod();
    });

    it("Winner event should be emitted and retrieved successfully", async function() {
        await contractInstance.openNeutralPeriod();
        const eventFilter = contractInstance.filters.Winner();      
        let abi = [
            "event Winner(string indexed _name, address indexed _maker, uint256 _minRequiredInvestment, string _investmentProposal)"
        ];
        let iface = new ethers.utils.Interface(abi)
        await ethers.provider.getLogs(eventFilter).then((logs) => {
            logs.forEach(async (log) => {
                console.log("Event attributes:");

                var proposal = iface.parseLog(log).args[3];
                console.log(`Name: ${proposal}`);

                var makerAddress = iface.parseLog(log).args[1];
                console.log(`Maker: ${makerAddress}`);

                var minRequiredInvestment = parseInt(iface.parseLog(log).args[2]);
                console.log(`Min Required Investment: ${minRequiredInvestment}`);

                var maker = await contractInstance.makersAttributes(makerAddress);
                console.log(`Maker name: ${maker.name}`);
            });
        });
    });
});