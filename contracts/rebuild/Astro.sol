// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AstroNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    uint256 private _nextTokenId;

    error Astro__OnlyOwner();

    constructor() ERC721("Astro", "ASTR") Ownable(_msgSender()) {}

    function mint(string memory _tokenURI) public returns (uint256) {
        _nextTokenId++;
        uint256 newTokenId = _nextTokenId;
        _safeMint(_msgSender(), newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        return newTokenId;
    }

    function updateTokenURI(uint256 tokenId, string memory _tokenURI) public {
        address owner = ERC721.ownerOf(tokenId);
        if (owner == address(0) || owner != _msgSender()) {
            revert Astro__OnlyOwner();
        }

        _setTokenURI(tokenId, _tokenURI);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
