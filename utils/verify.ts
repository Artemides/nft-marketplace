import { run } from "hardhat";

export const verify = async (contractAddress: string, args: any[]) => {
    try {
        console.log(`Verifying contract`);
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
        console.log(`${contractAddress} VERIFIED`);
    } catch (error: any) {
        if (error.message.toLowerCase().includes("already verified"))
            console.log(`${contractAddress} aldready verified`);
        console.error(error.message);
    }
};
