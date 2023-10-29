import { task } from "hardhat/config";
import * as path from "path";
import * as fs from "fs-extra";
import { filePathInDir, writeFileSyncTo } from "../utils/files";
const TYPECHAIN_TYPES_SRC = "typechain-types/contracts";
const dirDestination = process.env.NODE_SERVER_PATH || "../nft-marketplace-server";

task("export-typechain", "it exports contract types to a different proyect")
    .addParam("contract", "the contract types to be exported")
    .setAction(async (args, hre) => {
        try {
            const typechainSrc = path.join(__dirname, `../${TYPECHAIN_TYPES_SRC}`);
            const { contract } = args;
            // const filePath = filePathInDir(typechainSrc, contract);
            // if (!filePath) {
            //     console.log("unable to export a non exisiting contract type");
            //     return;
            // }
            // commonPath;

            // const repoPath = path.dirname(__dirname);
            // const fileDestination = path.join(dirDestination, filePath.replace(repoPath, ""));
            // fs.createFileSync(fileDestination);
            // fs.copySync(filePath, fileDestination);

            writeFileSyncTo(typechainSrc, contract, dirDestination);
            writeFileSyncTo(typechainSrc, "common", dirDestination);

            //export common
            // const commonPath = filePathInDir(typechainSrc, "common");
            // if (!commonPath) {
            //     console.log(`unable to export common.ts `);
            // }
            // const commonDestination = path.join(dirDestination, filePath.replace(repoPath, ""));
            // fs.createFileSync(commonDestination);
            // fs.copySync(filePath, fileDestination);
            console.log(`typechain-types successfully exported`);
        } catch (error) {
            console.error(error);
        }
    });
