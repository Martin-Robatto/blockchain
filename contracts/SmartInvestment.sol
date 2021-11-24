//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

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

    modifier onlyNewAuditors() {
        require(closeVotingPeriodVotes[0] != msg.sender, "The auditor has already authorized");
        require(closeVotingPeriodVotes[1] != msg.sender, "The auditor has already authorized");
        _;
    }

    modifier onlyVoters() {
        require(userRoles[msg.sender] == 0, "Not authorized");
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

    modifier hasEnoughAmountToVote() {
        require (msg.value >= 5 ether, "Not enough amount to vote");
        _;
    }

    modifier isVerified(address _address) {
        require(proposalsAttributes[_address].verified, "Proposal is not verified");
        _;
    }

    modifier hasEnoughAuthorizations() {
        require(proposalsTotalBalance >= 50 ether, "Total balance is not enough");
        require(closeVotingPeriodVotesAmount >= 2, "Not enough authorizations for closing voting period");
        _;
    }

    modifier alreadyAuthorized() {
        require(closeVotingPeriodVotesAmount < 2, "There are enough authorizations for closing voting period");
        _;
    }

    event Winner(string indexed _name, address indexed _maker, uint256 _minRequiredInvestment, string _investmentProposal); 

    constructor() { }

    function addOwner(address _address) external pausable() onlyOwners() isValid(_address) {
        userRoles[_address] = 1;
    }

    function addMaker(address _address, string calldata _name, string calldata _country, string calldata _passport) external pausable() onlyOwners() isValid(_address) {
        maker memory newMaker = maker(_name, _country, _passport);
        userRoles[_address] = 2;
        makersAttributes[_address] = newMaker;
        makersAmount++;
    }

    function addAuditor(address _address) external pausable() onlyOwners() isValid(_address) {
        userRoles[_address] = 3;
        auditorsAmount++;
    }

    function addInvestmentProposal(string calldata _name, string calldata _description, uint256 _minRequiredInvestment) external pausable() onlyMakers() onlySubmissionPeriod() {
        InvestmentProposal newInvestmentProposal = new InvestmentProposal();
        proposal memory newProposal = proposal(msg.sender, newInvestmentProposal, _name, _description, _minRequiredInvestment, 0, false);
        proposals[proposalsAmount] = address(newInvestmentProposal);
        proposalsAttributes[address(newInvestmentProposal)] = newProposal;
        proposalsAmount++;
    }

    function voteForProposal(address _address) external payable pausable() onlyVotingPeriod() onlyVoters() isVerified(_address) hasEnoughAmountToVote() {
        proposalsAttributes[_address].totalVotes += 1;
        payable(_address).transfer(msg.value);
        proposalsTotalBalance += msg.value;
    }

    function verifyProposal(address _address) external pausable() onlyAuditors() {
        proposalsAttributes[_address].verified = true;
    }

    function authorizeClosingPeriod() external pausable() onlyVotingPeriod() onlyAuditors() onlyNewAuditors() alreadyAuthorized() {
            closeVotingPeriodVotes[closeVotingPeriodVotesAmount] = msg.sender;
            closeVotingPeriodVotesAmount++;
    }

    function openSubmissionPeriod() external pausable() onlyNeutralPeriod() onlyOwners() hasEnoughWorkers() {
        actualPeriod = 1;
    }

    function openVotingPeriod() external pausable() onlySubmissionPeriod() onlyOwners() hasEnoughWorkers() hasEnoughInvestmentProposal() {
        actualPeriod = 2;
    }

    function openNeutralPeriod() external pausable() onlyVotingPeriod() onlyOwners() hasEnoughAuthorizations() {
        address winner = _getWinnerProposal();
        emit Winner(proposalsAttributes[winner].name, proposalsAttributes[winner].maker, proposalsAttributes[winner].minRequiredInvestment, proposalsAttributes[winner].name);
        _finalTransactions(winner);
        _resetValues();
    }

    function _getWinnerProposal() internal pausable() view returns (address) {
        address tempWinner = proposals[0];
        for (uint256 i = 0; i < proposalsAmount; i++) {
            bool isWinner = proposalsAttributes[proposals[i]].totalVotes > proposalsAttributes[tempWinner].totalVotes;
            if (proposals[i].balance > tempWinner.balance
                || (proposals[i].balance == tempWinner.balance && isWinner)) {
                tempWinner = proposals[i];
            }
        }
        return tempWinner;
    }

    function _finalTransactions(address _winner) internal pausable() {
        _takeCut(_winner);
        uint256 winnerIndex;
        proposal memory winnerAttributes = proposalsAttributes[_winner];
        for (uint256 i = 0; i < proposalsAmount - 1; i++) {
            if (proposals[i] != _winner) {
                _takeCut(proposals[i]);
                proposal memory attributes = proposalsAttributes[proposals[i]];
                attributes.instance.transferTo(_winner, proposals[i].balance);
                attributes.instance.destroyContract();
                delete proposalsAttributes[proposals[i]];
                delete proposals[i];
            }
            else {
                winnerIndex = i;
            }
        }
        winnerAttributes.instance.setOwner(winnerAttributes.maker);
        delete proposalsAttributes[_winner];
        delete proposals[winnerIndex];
    }

    function _takeCut(address _address) internal pausable() {
        proposal memory attributes = proposalsAttributes[_address];
        uint256 amount = _address.balance / 10;
        attributes.instance.transferTo(myAddress, amount);
    }

    function _resetValues() internal pausable() {
        actualPeriod = 0;
        proposalsAmount = 0;
        proposalsTotalBalance = 0;
        closeVotingPeriodVotesAmount = 0;
        delete closeVotingPeriodVotes;
    }

}
