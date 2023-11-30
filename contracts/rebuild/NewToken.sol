// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

abstract contract NewToken is
    Context,
    ERC165,
    IERC721,
    IERC721Metadata,
    IERC721Errors
{
    using Strings for uint256;

    string public _name;
    string public _symbol;

    mapping(uint256 tokenId => address) _owners;
    mapping(address owner => uint256) _balances;
    mapping(uint256 tokenId => address) _tokenApprovals;
    mapping(address owner => mapping(address operator => bool)) _operatorApprovals;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function balanceOf(address owner) public view virtual returns (uint256) {
        if (owner == address(0)) {
            revert ERC721InvalidOwner(address(0));
        }

        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        return _requiredOwned(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual returns (string memory) {
        _requiredOwned(tokenId);

        string memory uri = _baseURI();

        return
            bytes(uri).length > 0 ? string.concat(uri, tokenId.toString()) : "";
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) public view virtual returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function approve(address to, uint256 tokenId) public virtual {
        _approve(to, tokenId, _msgSender());
    }

    function getApproved(
        uint256 tokenId
    ) public view virtual returns (address) {
        _requiredOwned(tokenId);

        return _getApproved(tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public virtual {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    function _approve(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual {
        _approve(to, tokenId, auth, true);
    }

    function _approve(
        address to,
        uint256 tokenId,
        address auth,
        bool emitEvent
    ) internal virtual {
        if (emitEvent || auth != address(0)) {
            address owner = _ownerOf(tokenId);

            if (
                auth != address(0) &&
                owner != auth &&
                !isApprovedForAll(owner, auth)
            ) {
                revert ERC721InvalidApprover(auth);
            }

            if (emitEvent) {
                emit Approval(owner, to, tokenId);
            }
        }

        _tokenApprovals[tokenId] = to;
    }

    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual {
        if (operator == address(0)) {
            revert ERC721InvalidOperator(operator);
        }

        _operatorApprovals[owner][operator] = approved;

        emit ApprovalForAll(owner, operator, approved);
    }

    function _requiredOwned(
        uint256 tokenId
    ) internal view virtual returns (address) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }

        return owner;
    }

    function _ownerOf(uint256 tokenId) internal view virtual returns (address) {
        return _owners[tokenId];
    }

    function _baseURI() internal pure virtual returns (string memory) {
        return "";
    }

    function _getApproved(
        uint256 tokenId
    ) internal view virtual returns (address) {
        return _tokenApprovals[tokenId];
    }
}
