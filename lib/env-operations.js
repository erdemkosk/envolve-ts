const path = require('path');
const fs = require('fs');
const { table } = require('table')
const chalk = require('chalk');

const {
    getBaseFolder,
    createFolderIfDoesNotExist,
    getFilesRecursively,
    readFile,
    writeFile
} = require('./file-operations');

async function createEnvFile({ serviceName, content }) {
    const serviceFolderPath = path.join(getBaseFolder(), serviceName);
    createFolderIfDoesNotExist(serviceFolderPath);

    const filePath = path.join(serviceFolderPath, '.env');
    await writeFile({ file: filePath, newFileContents: content }, 'utf8');

    console.log(`File .env created for the "${chalk.blue(serviceName)}" service.`);
}

async function updateEnvFile({ file, content }) {
    await writeFile({ file, newFileContents: content }, 'utf8');
}

async function updateAllEnvFile({ oldValue, newValue }) {
    const files = await getFilesRecursively({ directory: getBaseFolder() });

    for (const file of files) {
        const fileContents = await readFile({ file });
        const newFileContents = changeValuesInEnv({ contents: fileContents, oldValue, newValue });

        if (newFileContents !== fileContents && newFileContents !== '') {
            await writeFile({ file, newFileContents }, 'utf8');
            console.log(`Environment variables updated in "${chalk.blue(file)}"`);
        }
    }
}

async function createSymlink({ targetPath }) {
    const symlinkPath = path.join(process.cwd(), '.env');

    try {
        await fs.promises.symlink(path.join(targetPath), symlinkPath, 'file');
        console.log(`Symbolic link created: "${chalk.blue(symlinkPath)}"`);
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

    console.log(table(data, config));
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