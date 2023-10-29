const path = require('path');

const {
    getBaseFolder,
    createFolderIfDoesNotExist,
    getFilesRecursively,
    readFile,
    writeFile,
    generateSymlink
} = require('./file-operations');

async function createEnvFile({ serviceName, content }) {
    const serviceFolderPath = path.join(getBaseFolder(), serviceName);
    createFolderIfDoesNotExist(serviceFolderPath);

    const filePath = path.join(serviceFolderPath, '.env');
    await writeFile({ file: filePath, newFileContents: content }, 'utf8');
}

async function updateEnvFile({ file, content }) {
    await writeFile({ file, newFileContents: content }, 'utf8');
}

async function updateAllEnvFile({ oldValue, newValue }) {
    const files = await getFilesRecursively({ directory: getBaseFolder() });
    const effectedServices = [];

    for (const file of files) {
        const fileContents = await readFile({ file });
        const newFileContents = changeValuesInEnv({ contents: fileContents, oldValue, newValue });

        if (newFileContents !== fileContents && newFileContents !== '') {
            await writeFile({ file, newFileContents }, 'utf8');
            effectedServices.push(file);
        }
    }

    return effectedServices;
}

async function createSymlink({ targetPath }) {
    const symlinkPath = path.join(process.cwd(), '.env');

    try {
        await generateSymlink({ targetPath: path.join(targetPath), symlinkPath });

        return symlinkPath;
    } catch (error) {
        console.error('Error creating symbolic link:', error);
    }
}

async function getValuesInEnv({ targetPath }) {
    const contents = await await readFile({ file: targetPath });
    const lines = contents.split('\n');

    const data = [['ENV', 'VALUE']];

    for (const line of lines) {
        if (line.trim() !== '') {
            const parts = line.split('=');
            if (parts.length === 2) {
                data.push([parts[0], parts[1]]);
            }
        }
    }

    const parts = targetPath.split('/');

    const directoryName = parts[parts.length - 2];

    const config = {
        columnDefault: {
            width: 50,
        },
        header: {
            alignment: 'center',
            content: directoryName,
        },
    }

    return {
        data , config
    }
}

function changeValuesInEnv({ contents, oldValue, newValue }) {
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

module.exports = {
    createEnvFile,
    updateEnvFile,
    updateAllEnvFile,
    createSymlink,
    getValuesInEnv
};