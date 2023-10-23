export type NetworkConfig = {
    [key: string]: {
        name: string;
        waitConfirmations?: number;
    };
};
export const networkConfig: NetworkConfig = {
    31337: {
        name: "hardhat",
        waitConfirmations: 1,
    },
    11155111: {
        name: "sepolia",
        waitConfirmations: 6,
    },
};

export const developmentChain = ["hardhat", "localhost"];
