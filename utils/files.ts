import * as fs from "fs-extra";
import * as path from "path";
export function filePathInDir(folderSrc: string, filename: string): string | null {
    try {
        const files = fs.readdirSync(folderSrc);
        for (const file of files) {
            const filePath = path.join(folderSrc, file);
            const fileStat = fs.statSync(filePath);

            if (fileStat.isDirectory()) {
                const exists = filePathInDir(filePath, filename);
                if (exists) return exists;
            }
            const fileExt = path.extname(file);
            const basename = file.replace(fileExt, "");
            if (basename.toLocaleLowerCase() === filename.toLocaleLowerCase()) {
                return filePath;
            }
        }
        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}
