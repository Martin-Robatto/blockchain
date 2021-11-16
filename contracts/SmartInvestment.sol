//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./Domain.sol";
import "./InvestmentProposal.sol";

contract SmartInvestment is Domain {

    bool public pause;

    mapping(address => uint256) public users;
    mapping(address => maker) public makersAttributes;
    mapping(address => uint256) public proposals;
    uint256 makersAmount;
    uint256 auditorsAmount;
    uint256 proposalsAmount;
    uint256 period;

    modifier onlyOwners() {
		require(users[msg.sender] == 1, "Not authorized");
		_;
	}

    modifier onlyMakers() {
		require(users[msg.sender] == 2, "Not authorized");
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

    modifier pausable() {
		require(!pause, "Contract is in Pause");
		_;
	}

    modifier hasEnoughBalance(uint256 _amount) {
        require(_amount <= address(this).balance, "Not enough balance");
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
        InvestmentProposal proposal = new InvestmentProposal(msg.sender, _name, _description, _minRequiredInvestment);
        proposalsAmount = proposalsAmount + 1;
        proposals[address(proposal)] = 0;
    }

    function voteForProposal(address _address) external payable hasEnoughAmount(msg.value) onlyVotingPeriod() pausable() {
        proposals[_address] += 1;
        payable(_address).transfer(msg.value);
    }

    function openSubmissionPeriod() external onlyOwners() onlyNeutralPeriod() pausable() {
        period = 1;
    }

    function openVotingPeriod() external onlyOwners() onlySubmissionPeriod() hasEnoughInvestmentProposal() pausable() {
        period = 2;
    }

    function openNeutralPeriod() external onlyOwners() onlyVotingPeriod() pausable() {
        period = 0;
    }

    function withdraw(uint256 _amount) external onlyOwners() hasEnoughBalance(_amount) pausable() {
        payable(msg.sender).transfer(_amount);
    }

    receive() external payable { }

    fallback() external payable { }

}
