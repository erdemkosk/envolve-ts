const fs = require('fs');
const path = require('path');
const homedir = require('os').homedir();

const baseFolder = path.join(homedir, '.envolve');

function createFolderIfDoesNotExist(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}

async function createEnvFile(servicename, content) {
    const serviceFolderPath = path.join(baseFolder, servicename);
    createFolderIfDoesNotExist(serviceFolderPath);

    await fs.promises.writeFile(path.join(serviceFolderPath, '.env'), content, 'utf8');
}

async function getFilesRecursively(dir) {
    const files = [];
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const dirent of dirents) {
        const resolvedPath = path.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            const subDirFiles = await getFilesRecursively(resolvedPath);
            files.push(...subDirFiles);
        } else {
            files.push(resolvedPath);
        }
    }

    return files;
}

function changeValuesInEnv(contents, oldValue, newValue) {
    const lines = contents.split('\n');
    const newLines = [];

    for (const line of lines) {
        if (line.startsWith(oldValue)) {
            const parts = line.split('=');
            newLines.push(`${parts[0]}=${newValue}`);
        } else {
            newLines.push(line);
        }
    }

    return newLines.join('\n');
}

async function updateEnvFile(oldValue, newValue){
    const files = await getFilesRecursively(baseFolder);

    for (const file of files) {
      const fileContents = await fs.promises.readFile(file, 'utf8');
      const newFileContents = changeValuesInEnv(fileContents, oldValue, newValue);

      if (newFileContents !== fileContents) {
        await fs.promises.writeFile(file, newFileContents, 'utf8');
        console.log(`Env changed in ${file}`);
      }
    }
}

module.exports = {
    createEnvFile,
    baseFolder,
    updateEnvFile
};