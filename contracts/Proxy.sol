//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./Domain.sol";

contract Proxy is Domain {

    /*bytes32 private constant implementationPosition = bytes32(uint256(
        keccak256('eip1967.proxy.implementation')) - 1
    ));*/

    address public implementation;
    bool public pause;

    mapping(address => uint256) public users;
    mapping(address => maker) public makersAttributes;
    uint256 makersAmount;
    uint256 auditorsAmount;
    mapping(address => investmentProposal) public proposals;
    uint256 proposalsAmount;
    uint256 period;
    
    modifier onlyOwners() {
		require(users[msg.sender] == 1, "Not authorized");
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

    event Upgraded(address indexed implementation); 

    constructor() {
        users[msg.sender] = 1;
    }

    function setImplementation(address _implementation) external onlyOwners() pausable() {
        implementation = _implementation;
        emit Upgraded(_implementation);
    }

    function setPause(bool _newValue) external onlyOwners() {
		pause = _newValue;
    }

    function withdraw(uint256 _amount) external onlyOwners() hasEnoughBalance(_amount) pausable() {
        payable(msg.sender).transfer(_amount);
    }

    receive() external payable { }

    fallback() external payable {    
        address _impl = implementation;

        assembly {
            let ptr := mload(0x40)

            // (1) copy incoming call data
            calldatacopy(ptr, 0, calldatasize())

            // (2) forward call to logic contract
            let result := delegatecall(gas(), _impl, ptr, calldatasize(), 0, 0)
            let size := returndatasize()

            // (3) retrieve return data
            returndatacopy(ptr, 0, size)

            // (4) forward return data back to caller
            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }

}