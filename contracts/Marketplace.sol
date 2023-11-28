// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {
    struct NftItem {
        uint256 price;
        address owner;
    }

    mapping(address => mapping(uint256 => NftItem)) s_nfts;
    mapping(address => uint256) s_sellings;

    event NftListedOn(
        address indexed nftAddress,
        uint256 tokenId,
        uint256 price
    );
    event NftPurchased(
        address indexed nftAddress,
        uint256 tokenId,
        uint256 price
    );
    event NftUnlisted(address indexed nftAddress, uint256 tokenId);
    event NftPriceUpdated(
        address indexed nftAddress,
        uint256 tokenId,
        uint256 newPrice
    );

    error Marketplace__PriceMustBeAboveZero();
    error Marketplace__NftUnAuthorized();
    error Marketplace__NftAlreadyListed();
    error Marketplace__NotNftOwner();
    error Marketplace__NftUnlisted();
    error Marketplace__UnsufficientPrice(
        address nftAddress,
        uint256 tokenId,
        uint256 requiredPrice
    );
    error Marketplace__UnsufficientFunds();
    error Marketplace__WithdrawalError();
    error Marketplace__SelfNftPurchaseNotAllowed(
        address nftAddress,
        uint256 tokenId,
        address owner
    );

    modifier onlyUnlisted(address nftAddress, uint256 tokenId) {
        NftItem memory nft = s_nfts[nftAddress][tokenId];
        if (nft.price > 0) revert Marketplace__NftAlreadyListed();

        _;
    }

    modifier onlyOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (owner != spender) revert Marketplace__NotNftOwner();

        _;
    }

    modifier onlyListed(address nftAddress, uint256 tokenId) {
        NftItem memory nft = s_nfts[nftAddress][tokenId];
        if (nft.price <= 0) revert Marketplace__NftUnlisted();

        _;
    }

    modifier onlyUnpossed(
        address nftAddress,
        uint256 tokenId,
        address buyer
    ) {
        NftItem memory nft = s_nfts[nftAddress][tokenId];
        if (nft.owner == buyer)
            revert Marketplace__SelfNftPurchaseNotAllowed(
                nftAddress,
                tokenId,
                nft.owner
            );

        _;
    }

    constructor() {}

    /**
     * @notice Method for listing an NFT on the marketplace
     * @param nftAddress : Address of the NFT
     * @param tokenId : token ID of the NFT
     * @param price : price of the NFT
     * @dev This way we allow owners still owen thei nft as they list on the marketplace
     */
    function listNft(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        onlyOwner(nftAddress, tokenId, msg.sender)
        onlyUnlisted(nftAddress, tokenId)
    {
        if (price <= 0) revert Marketplace__PriceMustBeAboveZero();

        IERC721 nft = IERC721(nftAddress);

        if (nft.getApproved(tokenId) != address(this))
            revert Marketplace__NftUnAuthorized();

        s_nfts[nftAddress][tokenId] = NftItem(price, msg.sender);

        emit NftListedOn(nftAddress, tokenId, price);
    }

    /**
     * @notice This function transfer safely the ownership of a NFT
     * @param nftAddress Nft Address
     * @param tokenId Nft Token ID
     * @dev Allows to purchase only listed, Unpossesed Nfts
     * @dev Uses NonReentrant security Open Zeppeling implementation
     */

    function buyNft(
        address nftAddress,
        uint256 tokenId
    )
        external
        payable
        onlyListed(nftAddress, tokenId)
        onlyUnpossed(nftAddress, tokenId, msg.sender)
    {
        NftItem memory nft = s_nfts[nftAddress][tokenId];

        if (nft.price != msg.value)
            revert Marketplace__UnsufficientPrice(
                nftAddress,
                tokenId,
                nft.price
            );

        s_sellings[nft.owner] += msg.value;
        delete s_nfts[nftAddress][tokenId];
        IERC721(nftAddress).safeTransferFrom(nft.owner, msg.sender, tokenId);

        emit NftPurchased(nftAddress, tokenId, nft.price);
    }

    function unlistNft(
        address nftAddress,
        uint256 tokenId
    )
        external
        onlyOwner(nftAddress, tokenId, msg.sender)
        onlyListed(nftAddress, tokenId)
    {
        delete s_nfts[nftAddress][tokenId];
        emit NftUnlisted(nftAddress, tokenId);
    }

    function updateNftPrice(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        onlyOwner(nftAddress, tokenId, msg.sender)
        onlyListed(nftAddress, tokenId)
    {
        s_nfts[nftAddress][tokenId].price = newPrice;
        emit NftPriceUpdated(nftAddress, tokenId, newPrice);
    }

    function withdrawBalance() external nonReentrant {
        uint256 balance = s_sellings[msg.sender];
        if (balance <= 0) revert Marketplace__UnsufficientFunds();

        s_sellings[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        if (!success) revert Marketplace__WithdrawalError();
    }

    function getNft(
        address nftAddress,
        uint256 tokenId
    ) public view returns (NftItem memory) {
        return s_nfts[nftAddress][tokenId];
    }

    function balanceOf(address seller) public view returns (uint256) {
        return s_sellings[seller];
    }
}
