//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./Domain.sol";
import "./InvestmentProposal.sol";
import "./Proxy.sol";

contract SmartInvestment is Domain, Proxy {

    modifier onlyMakers() {
		require(users[msg.sender] == 2, "Not authorized");
		_;
	}
    
    modifier onlyAuditors() {
		require(users[msg.sender] == 3, "Not authorized");
		_;
	}

    modifier hasEnoughWorkers() {
        require(makersAmount >= 3, "Not enough makers");
        require(auditorsAmount >= 2, "Not enough auditors");
        _;
    }

    modifier onlyNeutralPeriod() {
        require(period == 0, "Not in Neutral Period");
        _;
    }

    modifier onlySubmissionPeriod() {
        require(period == 1, "Not in Submission Period");
        _;
    }

    modifier onlyVotingPeriod() {
        require(period == 2, "Not in Voting Period");
        _;
    }

    modifier hasEnoughInvestmentProposal() {
        require(proposalsAmount >= 2, "Not enough investment proposals");
        _;
    }

    modifier isCorrect(address _address) {
        require(_address != address(0), "Address is the zero address");
        _;
    }

    modifier hasEnoughAmount(uint256 amount) {
        require (amount >= 5, "Not enough amount to vote");
        _;
    }

    modifier isVerified(address _address) {
        require(proposalsAttributes[_address].verified, "Proposal is not verified");
        _;
    }

    modifier requirementsForClosingPeriodFullfilled() {
        require(totalBalance >= 50, "Total balance is not enough");
        require(athorizationForClosingVotingPeriod >= 2, "Not enough authorizations for closing voting period");
        _;
    }

    constructor() { }

    function addOwner(address _newValue) external onlyOwners() isCorrect(_newValue) pausable() {
        users[_newValue] = 1;
    }

    function addAuditor(address _newValue) external onlyOwners() isCorrect(_newValue) pausable() {
        users[_newValue] = 3;
        auditorsAmount = auditorsAmount + 1;
    }

    function addMaker(address _newValue, string calldata _name, string calldata _country, string calldata _passport) external onlyOwners() isCorrect(_newValue) pausable() {
        maker memory newMaker = maker(_name, _country, _passport);
        users[_newValue] = 2;
        makersAttributes[_newValue] = newMaker;
        makersAmount = makersAmount + 1;
    }

    function addInvestmentProposal(string calldata _name, string calldata _description, uint256 _minRequiredInvestment) external onlyMakers() onlySubmissionPeriod() pausable() {
        InvestmentProposal newInvestmentProposal = new InvestmentProposal();
        proposal memory newProposal = proposal(msg.sender,address(newInvestmentProposal), _name, _description, _minRequiredInvestment,0, false);
        proposalsAttributes[address(newInvestmentProposal)] = newProposal;
        proposals[proposalsAmount] = address(newInvestmentProposal);
        proposalsAmount = proposalsAmount + 1;
    }

    function voteForProposal(address _address) external payable hasEnoughAmount(msg.value) onlyVotingPeriod() isVerified(_address) pausable() {
        proposalsAttributes[_address].totalVotes += 1;
        payable(_address).transfer(msg.value);
        totalBalance += msg.value;
    }
    
    function getProposalWithMostVotes() external onlyAuditors() onlyVotingPeriod() pausable() view returns (address) {
        uint256 max = 0;
        uint256 index = 0;
        for (uint256 i = 0; i < proposalsAmount; i++) {
            if (proposalsAttributes[proposals[i]].totalVotes > max) {
                max = proposalsAttributes[proposals[i]].totalVotes;
                index = i;
            }
        }
        return proposalsAttributes[proposals[index]].proposal;
    }

    function verifyProposal(address _address) external onlyAuditors() pausable() {
        proposalsAttributes[_address].verified = true;
    }

    function authorizeClosingPeriod() external onlyAuditors() onlyVotingPeriod() pausable() {
        athorizationForClosingVotingPeriod = athorizationForClosingVotingPeriod + 1;
    }

    function openSubmissionPeriod() external onlyOwners() onlyNeutralPeriod() pausable() {
        period = 1;
    }

    function openVotingPeriod() external onlyOwners() onlySubmissionPeriod() hasEnoughInvestmentProposal() pausable() {
        period = 2;
    }

    function openNeutralPeriod() external onlyOwners() onlyVotingPeriod() requirementsForClosingPeriodFullfilled() pausable() {
        period = 0;
        //se reinician los valores? o que hacemos?
    }
}
