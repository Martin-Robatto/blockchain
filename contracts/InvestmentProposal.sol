//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./Domain.sol";

contract InvestmentProposal is Domain {

    address public owner;
    bool public pause;
    proposal public investmentProposal;

    modifier onlyOwner() {
		require(msg.sender == owner, "Not authorized");
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

    constructor(address _address, string memory _name, string memory _description, uint256 _minRequiredInvestment) {
        proposal memory newInvestmentProposal = proposal(_address, _name, _description, _minRequiredInvestment);
        investmentProposal = newInvestmentProposal;
        owner = msg.sender;
    }

    function setOwner(address _newValue) external onlyOwner() isCorrect(_newValue) pausable() {
        owner = _newValue;
    }

    function setPause(bool _newValue) external onlyOwner() {
		pause = _newValue;
    }

    function withdraw(uint256 _amount) external onlyOwner() hasEnoughBalance(_amount) pausable() {
        payable(msg.sender).transfer(_amount);
    }

    receive() external payable { }

    fallback() external payable { }

    function destroyContract() external {
        selfdestruct(payable(owner));
    }

}