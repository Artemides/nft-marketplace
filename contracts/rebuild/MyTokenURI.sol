// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./MyToken.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";

abstract contract MyTokenURI is MyERC721, IERC4906 {
    using Strings for uint256;

    mapping(uint256 => string) _tokenURIs;

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(MyERC721, IERC165) returns (bool) {
        return interfaceId == bytes4(0x49064906) || super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        if (bytes(base).length == 0) {
            return _tokenURI;
        }

        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return super.tokenURI(tokenId);
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "MyTokenURI: URI set to non existing token");

        _tokenURIs[tokenId] = _tokenURI;

        emit MetadataUpdate(tokenId);
    }

    function hasURI(uint256 tokenId) public view virtual returns (bool) {
        return bytes(_tokenURIs[tokenId]).length > 0;
    }

    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);

        if (hasURI(tokenId)) {
            delete _tokenURIs[tokenId];
        }
    }
}
