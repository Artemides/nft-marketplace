// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/interfaces/IERC721Metadata.sol";
import "@openzeppelin/contracts/interfaces/IERC1155.sol";

contract MyERC721 is Context, IERC721, ERC165, IERC721Metadata {
    using Strings for uint256;

    string public _name;
    string public _symbol;

    mapping(uint256 => address) public _owners;
    mapping(address => uint256) public _balances;
    mapping(uint256 => address) public _tokenApprovals;
    mapping(address => mapping(address => bool)) _operatorApprovals;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165, IERC165) returns (bool) {
        return (interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId));
    }

    function balanceOf(
        address owner
    ) public view virtual override returns (uint256) {
        require(
            owner != address(0),
            "MyERC721: address 0 is not a valid address"
        );

        return _balances[owner];
    }

    function ownerOf(
        uint256 tokenId
    ) public view virtual override returns (address) {
        address owner = _ownerOf(tokenId);
        require(
            owner != address(0),
            "MyERC721: Address 0 is not a valid owner"
        );

        return owner;
    }

    function _ownerOf(uint256 tokenId) internal view returns (address) {
        return _owners[tokenId];
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        string memory _baseUri = _baseURI();
        if (bytes(_baseUri).length > 0) {
            return string(abi.encodePacked(_baseUri, tokenId.toString()));
        }

        return "";
    }

    function approve(address to, uint256 tokenId) public virtual override {
        address owner = this.ownerOf(tokenId);
        require(owner != to, "MyERC721:approve to current owner");
        require(
            owner == _msgSender() || isApprovedForAll(owner, _msgSender()),
            "MyERC721: Approve Caller is not the token owner or approved to magane it"
        );
        _approve(to, tokenId);
    }

    function getApproved(
        uint256 tokenId
    ) public view virtual override returns (address) {
        _requireMinted(tokenId);

        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(
        address operator,
        bool approved
    ) public virtual override {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "MyERC721: caller is not alled to manage this token"
        );
        _transfer(from, to, tokenId);
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {
        address tokenOwner = this.ownerOf(tokenId);
        require(tokenOwner == from, "MyERC721: incorrect transfer owner");
        require(to != address(0), "MyERC721: cannot trasnfer to address 0");
        //before transfering

        require(tokenOwner == from, "MyERC721: trasnfer from incorrect owner");

        delete _tokenApprovals[tokenId];
        unchecked {
            _balances[from] -= 1;
            _balances[to] += 1;
        }
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);

        //afer transfer
    }

    function _burn(uint256 tokenId) internal virtual {
        address owner = this.ownerOf(tokenId);
        _beforeTokenTransfer(owner, address(0), tokenId, 1);
        owner = this.ownerOf(tokenId);

        delete _tokenApprovals[tokenId];
        unchecked {
            _balances[owner] -= 1;
        }

        delete _owners[tokenId];
        emit Transfer(owner, address(0), tokenId);
        _afterTokenTransfer(owner, address(0), tokenId, 1);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {}

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "MyERC721: caller is not owner or approved"
        );

        _safeTransfer(from, to, tokenId, data);
    }

    function _safeTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal virtual {
        _transfer(from, to, tokenId);
        require(
            _checkOnERC721Received(from, to, tokenId, data),
            "ERC721: transfer to non ERC721Receiver implementer"
        );
    }

    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal virtual {
        _mint(to, tokenId);
        require(
            _checkOnERC721Received(address(0), to, tokenId, data),
            "MyERC721: mint to a non ERC721Receiver implement"
        );
    }

    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "MyERC721: mint to zero address");
        require(!_exists(tokenId), "MyERC721: Token already minted");

        _beforeTokenTransfer(address(0), to, tokenId, 1);
        require(!_exists(tokenId), "MyERC721: Token already minted");

        unchecked {
            _balances[to] += 1;
        }

        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId, 1);
    }

    function _isApprovedOrOwner(
        address spender,
        uint256 tokenId
    ) internal view returns (bool) {
        address owner = this.ownerOf(tokenId);
        return
            owner == spender ||
            owner == this.getApproved(tokenId) ||
            isApprovedForAll(owner, spender);
    }

    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal {
        require(owner != operator, "MyERC721: approve to caller");
        _operatorApprovals[owner][operator] = true;
        emit ApprovalForAll(owner, operator, approved);
    }

    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(MyERC721.ownerOf(tokenId), to, tokenId);
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) public view virtual override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function _requireMinted(uint256 tokenId) internal view virtual {
        require(
            _exists(tokenId),
            "MyERC721: Invalid TokenId, it does not exists"
        );
    }

    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _baseURI() internal view virtual returns (string memory) {
        return ("");
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual {}

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual {}

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.code.length > 0) {
            try
                IERC721Receiver(to).onERC721Received(
                    _msgSender(),
                    from,
                    tokenId,
                    data
                )
            returns (bytes4 res) {
                return res == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert(
                        "MyERC721: transfer to a non IERC721Receiver implementer "
                    );
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }

        return true;
    }
}
