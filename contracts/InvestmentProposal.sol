//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

contract InvestmentProposal {

    address public owner;
    bool public pause;

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

    constructor() {
        owner = msg.sender;
    }

    function setOwner(address _newValue) external onlyOwner() isCorrect(_newValue) pausable() {
        owner = _newValue;
    }

    function setPause(bool _newValue) external onlyOwner() {
		pause = _newValue;
    }

    function withdraw(address _address, uint256 _amount) external onlyOwner() hasEnoughBalance(_amount) pausable() {
        payable(_address).transfer(_amount);
    }

    receive() external payable { }

    fallback() external payable { }

    function destroyContract() external onlyOwner() pausable() {
        selfdestruct(payable(owner));
    }

}