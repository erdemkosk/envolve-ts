/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-use-before-define */
const path = require('path');

const {
  getBaseFolder,
  createFolderIfDoesNotExist,
  getFilesRecursively,
  readFile,
  writeFile,
  generateSymlink,
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

  // eslint-disable-next-line no-restricted-syntax
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

  await generateSymlink({ targetPath: path.join(targetPath), symlinkPath });

  return symlinkPath;
}

async function getValuesInEnv({ targetPath }) {
  const contents = await readFile({ file: targetPath });
  const lines = contents.split('\n');

  const data = [['ENV', 'VALUE']];

  // eslint-disable-next-line no-restricted-syntax
  for (const line of lines) {
    if (line.trim() !== '') {
      const parts = line.split('=');
      if (parts.length === 2) {
        data.push([parts[0], parts[1]]);
      }
    }
  }

  const directoryName = getServiceNameFromUrl({ targetPath });

  const config = {
    columnDefault: {
      width: 50,
    },
    header: {
      alignment: 'center',
      content: directoryName,
    },
  };

  return {
    data, config,
  };
}

function getServiceNameFromUrl({ targetPath }) {
  const parts = targetPath.split('/');

  return parts[parts.length - 2];
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

async function compareEnvFiles({ source, destination }) {
  const sourceContent = await readFile({ file: source });
  const destinationContent = await readFile({ file: destination });

  const sourceLines = sourceContent.split('\n');
  const destinationLines = destinationContent.split('\n');

  const sourceServiceName = getServiceNameFromUrl({ targetPath: source });
  const destinationServiceName = getServiceNameFromUrl({ targetPath: destination });

  const differentVariables = [['Variable Name', sourceServiceName, destinationServiceName]];

  sourceLines.forEach((sourceLine) => {
    const sourceLineParts = sourceLine.split('=');
    const variableName = sourceLineParts[0];
    const sourceValue = sourceLineParts[1];

    const matchingDestinationLine = destinationLines.find((destinationLine) => {
      const destinationLineParts = destinationLine.split('=');
      return destinationLineParts[0] === variableName;
    });

    if (matchingDestinationLine) {
      const destinationValue = matchingDestinationLine.split('=')[1];
      if (sourceValue !== destinationValue) {
        differentVariables.push([
          variableName,
          sourceValue,
          destinationValue,
        ]);
      }
    }
  });

  return differentVariables;
}

module.exports = {
  createEnvFile,
  updateEnvFile,
  updateAllEnvFile,
  createSymlink,
  getValuesInEnv,
  compareEnvFiles,
};
