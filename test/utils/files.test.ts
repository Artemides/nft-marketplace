import fs from "fs-extra";
import { filePathInDir } from "../../utils/files";
import { expect } from "chai";
import path from "path";
describe("files tests", () => {
    describe("exists File in Directory", () => {
        before(async () => {
            await fs.ensureDir("testfn/subtest");
            await fs.ensureFile("testfn/test1.txt");
            await fs.ensureFile("testfn/subtest/test2.txt");
        });
        after(async () => {
            await fs.remove("testfn");
        });

        it("should return null if the folder does not exists", () => {
            const folder = "testx";
            const file = "testx.txt";
            const exists = filePathInDir(folder, file);
            expect(exists).to.be.null;
        });
        it("should return null if the folde does not include the file", () => {
            const folder = "testfn";
            const file = "testx.txt";
            const exists = filePathInDir(folder, file);
            expect(exists).to.be.null;
        });
        it("should return true if the folder includes the file as direct child", () => {
            const folder = "testfn";
            const file = "test1.txt";
            const exists = filePathInDir(folder, file);
            expect(exists).to.be.equal(path.join(folder, file));
        });
        it("should return true if the folder includes the file in a subfolder within", () => {
            const folder = "testfn";
            const file = "test2.txt";
            const exists = filePathInDir(folder, file);
            expect(exists).to.be.equal(path.join(folder, "subtest", file));
        });
    });
});
