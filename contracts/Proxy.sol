//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./Domain.sol";

contract Proxy is Domain {

    address public implementation;
    address public myAddress;
    bool public pause;

    mapping(address => uint256) public userRoles;
    mapping(address => maker) public makersAttributes;
    mapping(uint256 => address) public proposals;
    mapping(address => proposal) public proposalsAttributes;
    address[2] public closeVotingPeriodVotes;

    uint256 public makersAmount;
    uint256 public auditorsAmount;
    uint256 public proposalsAmount;
    uint256 public proposalsTotalBalance;
    uint256 public closeVotingPeriodVotesAmount;

    uint256 public actualPeriod;
    
    modifier onlyOwners() {
		require(userRoles[msg.sender] == 1, "Not authorized");
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

    event Upgraded(address indexed _address); 

    constructor() payable {
        userRoles[msg.sender] = 1;
        myAddress = address(this);
    }

    function setImplementation(address _address) external pausable() onlyOwners() isValid(_address) {
        implementation = _address;
        emit Upgraded(_address);
    }

    function setPause(bool _newValue) external onlyOwners() {
		pause = _newValue;
    }

    function getBalance() external view pausable() onlyOwners() returns(uint256) {
        return address(this).balance / 1e18;
    }

    function transferTo(address _address, uint256 _amount) external pausable() onlyOwners() hasEnoughBalance(_amount) {
        payable(_address).transfer(_amount);
    }

    function withdraw(uint256 _amount) external pausable() onlyOwners() hasEnoughBalance(_amount) {
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