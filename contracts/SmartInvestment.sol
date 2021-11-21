//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./Domain.sol";
import "./InvestmentProposal.sol";
import "./Proxy.sol";

contract SmartInvestment is Proxy {

    modifier onlyMakers() {
		require(userRoles[msg.sender] == 2, "Not authorized");
		_;
	}
    
    modifier onlyAuditors() {
		require(userRoles[msg.sender] == 3, "Not authorized");
		_;
	}

    modifier hasEnoughWorkers() {
        require(makersAmount >= 3, "Not enough makers");
        require(auditorsAmount >= 2, "Not enough auditors");
        _;
    }

    modifier onlyNeutralPeriod() {
        require(actualPeriod == 0, "Not in Neutral Period");
        _;
    }

    modifier onlySubmissionPeriod() {
        require(actualPeriod == 1, "Not in Submission Period");
        _;
    }

    modifier onlyVotingPeriod() {
        require(actualPeriod == 2, "Not in Voting Period");
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
        require(proposalsTotalBalance >= 50, "Total balance is not enough");
        require(closeVotingPeriodVotes >= 2, "Not enough authorizations for closing voting period");
        _;
    }

    constructor() { }

    function addOwner(address _newValue) external onlyOwners() isCorrect(_newValue) pausable() {
        userRoles[_newValue] = 1;
    }

    function addMaker(address _newValue, string calldata _name, string calldata _country, string calldata _passport) external onlyOwners() isCorrect(_newValue) pausable() {
        maker memory newMaker = maker(_name, _country, _passport);
        userRoles[_newValue] = 2;
        makersAttributes[_newValue] = newMaker;
        makersAmount++;
    }

    function addAuditor(address _newValue) external onlyOwners() isCorrect(_newValue) pausable() {
        userRoles[_newValue] = 3;
        auditorsAmount++;
    }

    function addInvestmentProposal(string calldata _name, string calldata _description, uint256 _minRequiredInvestment) external onlyMakers() onlySubmissionPeriod() pausable() {
        InvestmentProposal newInvestmentProposal = new InvestmentProposal();
        proposal memory newProposal = proposal(msg.sender, newInvestmentProposal, _name, _description, _minRequiredInvestment, 0, false);
        proposalsAttributes[address(newInvestmentProposal)] = newProposal;
        proposals[proposalsAmount] = address(newInvestmentProposal);
        proposalsAmount++;
    }

    function voteForProposal(address _address) external payable hasEnoughAmount(msg.value) onlyVotingPeriod() isVerified(_address) pausable() {
        proposalsAttributes[_address].totalVotes += 1;
        payable(_address).transfer(msg.value);
        proposalsTotalBalance += msg.value;
    }

    function verifyProposal(address _address) external onlyAuditors() pausable() {
        proposalsAttributes[_address].verified = true;
    }

    function authorizeClosingPeriod() external onlyAuditors() onlyVotingPeriod() pausable() {
        closeVotingPeriodVotes++;
    }

    function openSubmissionPeriod() external onlyOwners() onlyNeutralPeriod() pausable() {
        actualPeriod = 1;
    }

    function openVotingPeriod() external onlyOwners() onlySubmissionPeriod() hasEnoughInvestmentProposal() pausable() {
        actualPeriod = 2;
    }

    function openNeutralPeriod() external onlyOwners() onlyVotingPeriod() requirementsForClosingPeriodFullfilled() pausable() {
        actualPeriod = 0;
        address winner = getWinnerProposal();
        emit Winner(proposalsAttributes[winner].name, proposalsAttributes[winner].maker, proposalsAttributes[winner].minRequiredInvestment);
        finalOperations(winner);
    }

    function getWinnerProposal() internal pausable() view returns (address) {
        address tempWinner = proposals[0];
        for (uint256 i = 0; i < proposalsAmount - 1; i++) {
            if (proposals[i].balance > tempWinner.balance) {
                tempWinner = proposals[i];
            }
            else if (proposals[i].balance == tempWinner.balance) {
                if (proposalsAttributes[proposals[i]].totalVotes > proposalsAttributes[tempWinner].totalVotes) {
                    tempWinner = proposals[i];
                }
            }
        }
        return tempWinner;
    }

    event Winner(string indexed name, address indexed maker, uint256 minRequiredInvestment); 

    function finalOperations(address _winner) internal pausable() {
        for (uint256 i = 0; i < proposalsAmount - 1; i++) {
            takeCut(proposals[i]);
            proposal memory attributes = proposalsAttributes[proposals[i]];
            if (proposals[i] != _winner) {
                attributes.instance.withdraw(_winner, proposals[i].balance);
                attributes.instance.destroyContract();
            }
            else {
                attributes.instance.setOwner(attributes.maker);
            }
            delete proposalsAttributes[proposals[i]];
            delete proposals[i];
        }
    }

    function takeCut(address _address) internal pausable() {
        InvestmentProposal proposal = proposalsAttributes[_address].instance;
        uint256 cut = _address.balance / 10;
        proposal.withdraw(myAddress, cut);
    }
}
