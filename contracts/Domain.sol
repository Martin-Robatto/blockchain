//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

contract Domain {

    struct maker {
        string name;
        string country;
        string passport;
    }

    struct proposal {
        address maker;
        string name;
        string description;
        uint256 minRequiredInvestment;
    }

}