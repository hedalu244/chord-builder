const fs = require("fs");
const path = require("path");

const SRC_DIR = path.resolve(__dirname, "..", "src");
const DEST_DIR = path.resolve(__dirname, "..", "docs");

function isTypeScriptFile(fileName) {
    return /\.(ts|tsx)$/i.test(fileName);
}

function copyStaticFiles() {
    const stack = [SRC_DIR];

    while (stack.length > 0) {
        const currentDir = stack.pop();
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                stack.push(sourcePath);
                continue;
            }

            if (isTypeScriptFile(entry.name)) {
                continue;
            }

            const relativePath = path.relative(SRC_DIR, sourcePath);
            const destinationPath = path.join(DEST_DIR, relativePath);
            fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
            fs.copyFileSync(sourcePath, destinationPath);
        }
    }
}

if (require.main === module) {
    copyStaticFiles();
}

module.exports = {
    copyStaticFiles,
};
