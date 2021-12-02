//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./InvestmentProposal.sol";

contract Domain {

    struct maker {
        string name;
        string country;
        string passport;
    }

    struct proposal {
        address maker;
        InvestmentProposal instance;
        uint256 totalVotes;
        bool verified;
    }

}