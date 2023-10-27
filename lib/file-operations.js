const fs = require('fs');
const path = require('path');
const os = require('os');

const homedir = os.homedir();
const baseFolder = path.join(homedir, '.envolve');

function getBaseFolder() {
   return baseFolder;
}

function createFolderIfDoesNotExist(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}

async function getFilesRecursively({directory}) {
    const files = [];
    const dirents = await fs.promises.readdir(directory, { withFileTypes: true });

    for (const dirent of dirents) {
        const resolvedPath = path.resolve(directory, dirent.name);
        if (dirent.isDirectory()) {
            const subDirFiles = await getFilesRecursively({directory: resolvedPath });
            files.push(...subDirFiles);
        } else {
            files.push(resolvedPath);
        }
    }

    return files;
}

async function readFile({file}) {
    if (fs.existsSync(file)) {
        return await fs.promises.readFile(file, 'utf8');
      }
}

async function writeFile({file, newFileContents}) {
    await fs.promises.writeFile(file, newFileContents, 'utf8');
}

async function generateSymlink({targetPath, symlinkPath}) {
    await fs.promises.symlink(path.join(targetPath), symlinkPath, 'file');
}

module.exports = {
    getBaseFolder,
    getFilesRecursively,
    createFolderIfDoesNotExist,
    readFile,
    writeFile,
    generateSymlink,
};
