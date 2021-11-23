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

    modifier isValid(address _address) {
        require(_address != address(0), "Address is the zero address");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setOwner(address _address) external pausable() onlyOwner() isValid(_address) {
        owner = _address;
    }

    function setPause(bool _newValue) external onlyOwner() {
		pause = _newValue;
    }

    function getBalance() external view pausable() onlyOwner() returns(uint256) {
        return address(this).balance / 1e18;
    }

    function transferTo(address _address, uint256 _amount) external pausable() onlyOwner() hasEnoughBalance(_amount) {
        payable(_address).transfer(_amount);
    }

    function withdraw(uint256 _amount) external pausable() onlyOwner() hasEnoughBalance(_amount) {
        payable(msg.sender).transfer(_amount);
    }

    receive() external payable { }

    fallback() external payable { }

    function destroyContract() external pausable() onlyOwner() {
        selfdestruct(payable(owner));
    }

}