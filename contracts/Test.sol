//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

contract Test {

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
        require(_amount <= address(this).balance);
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setPause(bool _newValue) external onlyOwner() {
		this.pause = _newValue;
    }

    function withdraw(uint256 _amount) external onlyOwner() pausable() hasEnoughBalance(_amount) {
        payable(owner).transfer(_amount);
    }

}
