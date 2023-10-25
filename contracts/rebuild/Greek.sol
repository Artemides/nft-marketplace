// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./MyTokenURI.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GreeKToken is MyTokenURI, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() MyERC721("greek", "GRK") {}

    function mint() public onlyOwner {
        _tokenIds.increment();
    }
}
