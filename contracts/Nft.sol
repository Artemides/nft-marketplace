// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

//create NFT using open zepelling
//should have a ipfs image
//TokenId as counter
//return the URI
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Nft is ERC721 {
    uint256 private s_tokenCounter;
    string public constant NFT_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    constructor() ERC721("Helios", "HIOS") {
        s_tokenCounter = 0;
    }

    function mint() public returns (uint256) {
        s_tokenCounter += 1;
        _safeMint(msg.sender, s_tokenCounter);
        return s_tokenCounter;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function tokenURI(uint256 /* tokenId */) public pure override returns (string memory) {
        return NFT_URI;
    }
}
