// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract NFTMarket is Context, ReentrancyGuard {
    struct MarketNft {
        uint256 price;
        address owner;
    }

    mapping(address => mapping(uint256 => MarketNft)) _marketNfts;
    mapping(address => uint256) _sellings;

    event NFTListenOn(
        address indexed nftAddress,
        uint256 tokenId,
        uint256 price
    );
    event NFTPurchased(
        address indexed nftAddress,
        uint256 tokenId,
        uint256 price
    );
    event NFTUnlisted(address indexed nftAddress, uint256 tokenId);
    event NFTPriceUpdated(
        address indexed nftAddress,
        uint256 tokenId,
        uint256 oldPrice,
        uint256 newPrice
    );

    error NFTMarket__PriceMustBeAboveZero();
    error NFTMarket__NftUnauthorized();
    error NFTMarket__NftAlreadyListed();
    error NFTMarket__NoNftOwner();
    error NFTMarket__InsufficientPrice(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    );
    error NFTMarket__InsufficientFunds();
    error NFTMarket__Withdraw();
    error NFTMarket__SelfPurchase();
    error NFTMarket__Unlisted();

    modifier onlyNftOwner(address nftAddress, uint256 tokenId) {
        address nftOwner = IERC721(nftAddress).ownerOf(tokenId);
        if (nftOwner != _msgSender()) revert NFTMarket__NoNftOwner();
        _;
    }

    constructor() {}

    function listNft(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external onlyNftOwner(nftAddress, tokenId) {
        if (isListed(nftAddress, tokenId)) revert NFTMarket__NftAlreadyListed();
        if (price <= 0) revert NFTMarket__PriceMustBeAboveZero();
        if (!_isAuthorized(nftAddress, tokenId))
            revert NFTMarket__NftUnauthorized();

        _marketNfts[nftAddress][tokenId] = MarketNft(price, _msgSender());

        emit NFTListenOn(nftAddress, tokenId, price);
    }

    function unlistNft(
        address nftAddress,
        uint256 tokenId
    ) external onlyNftOwner(nftAddress, tokenId) {
        if (!isListed(nftAddress, tokenId)) revert NFTMarket__Unlisted();

        delete _marketNfts[nftAddress][tokenId];

        emit NFTUnlisted(nftAddress, tokenId);
    }

    function purchaseNft(address nftAddress, uint256 tokenId) external payable {
        if (!isListed(nftAddress, tokenId)) revert NFTMarket__Unlisted();

        MarketNft memory nft = _marketNfts[nftAddress][tokenId];
        if (nft.owner == _msgSender()) revert NFTMarket__SelfPurchase();
        if (nft.price != msg.value)
            revert NFTMarket__InsufficientPrice(nftAddress, tokenId, nft.price);

        _sellings[nft.owner] += nft.price;
        delete _marketNfts[nftAddress][tokenId];
        IERC721(nftAddress).safeTransferFrom(nft.owner, _msgSender(), tokenId);

        emit NFTPurchased(nftAddress, tokenId, nft.price);
    }

    function updateNftPrice(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) public onlyNftOwner(nftAddress, tokenId) {
        if (!isListed(nftAddress, tokenId)) revert NFTMarket__Unlisted();
        if (newPrice <= 0) revert NFTMarket__PriceMustBeAboveZero();

        MarketNft storage nft = _marketNfts[nftAddress][tokenId];
        uint256 oldPrice = nft.price;
        nft.price = newPrice;

        emit NFTPriceUpdated(nftAddress, tokenId, oldPrice, newPrice);
    }

    function withdrawBalance() external nonReentrant {
        uint256 balance = _sellings[_msgSender()];
        if (balance <= 0) revert NFTMarket__InsufficientFunds();

        _sellings[_msgSender()] = 0;

        (bool success, ) = payable(_msgSender()).call{value: balance}("");
        if (!success) revert NFTMarket__Withdraw();
    }

    function _isAuthorized(
        address nftAddress,
        uint256 tokenId
    ) internal view returns (bool) {
        IERC721 nft = IERC721(nftAddress);
        bool isApproved = nft.getApproved(tokenId) == address(this);
        address nftOwner = nft.ownerOf(tokenId);
        bool isApprovedForAll = nft.isApprovedForAll(nftOwner, address(this));
        console.log(">>>", isApproved, isApprovedForAll);
        return isApproved || isApprovedForAll;
    }

    function isListed(
        address nftAddress,
        uint256 tokenId
    ) internal view returns (bool) {
        MarketNft memory nft = _marketNfts[nftAddress][tokenId];
        return nft.owner != address(0) && nft.price > 0;
    }

    function balanceOf(address seller) public view returns (uint256) {
        return _sellings[seller];
    }

    function getNft(
        address nftAddress,
        uint256 tokenId
    ) public view returns (MarketNft memory) {
        return _marketNfts[nftAddress][tokenId];
    }
}
