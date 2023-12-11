import * as path from 'path'
import {
  getBaseFolder,
  createFolderIfDoesNotExist,
  getEnvFilesRecursively,
  readFile,
  writeFile,
  generateSymlink,
  copyFile,
  deleteFile,
  getEnvFiles,
  doesFileExist
} from './fileHandler'

import {
  saveFieldVersion,
  saveFieldVersionsInSync
} from './historyHandler'

import MongoDBURIComparerLogic from '../logic/fuzzy.logic'

function getServiceNameFromUrl ({ targetPath }: { targetPath: string }): string {
  const parts = targetPath.split('/')
  return parts[parts.length - 2]
}

function extractEnvVariable (line: string): [string, string] {
  const indexOfFirstEqualSign = line.indexOf('=')
  if (indexOfFirstEqualSign >= 0) {
    const envName = line.substring(0, indexOfFirstEqualSign)
    const envValue = line.substring(indexOfFirstEqualSign + 1)
    return [envName, envValue]
  }
  return ['', '']
}

function changeValuesInEnv ({
  contents,
  envValue,
  newValue
}: {
  contents: string
  envValue: string
  newValue: string
}): string {
  const lines = contents.split('\n')
  const newLines = []

  for (const line of lines) {
    const parts = line.split('=')
    if (parts[0] === envValue) {
      newLines.push(`${envValue}=${newValue}`)
    } else {
      newLines.push(line)
    }
  }

  return newLines.join('\n')
}

async function createSymlink ({
  targetPath
}: {
  targetPath: string
}): Promise<string> {
  const symlinkPath = path.join(process.cwd(), '.env')
  await generateSymlink({ targetPath: path.join(targetPath), symlinkPath })
  return symlinkPath
}

export async function updateEnvFile ({
  file,
  envValue,
  newValue
}: {
  file: string
  envValue: string
  newValue: string
}): Promise<void> {
  const oldValue = await getEnvValue(file, envValue)

  if (oldValue !== undefined) {
    const updatedFileContent = await readFile({ file })

    if (updatedFileContent !== undefined) {
      const updatedLines = updatedFileContent.split('\n').map(line => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [currentEnvName, currentEnvValue] = extractEnvVariable(line)
        if (currentEnvName === envValue) {
          return `${currentEnvName}=${newValue}`
        }
        return line
      })

      await saveFieldVersion(file, envValue, newValue)

      await writeFile({
        file,
        newFileContents: updatedLines.join('\n')
      })
    } else {
      console.error(`File cannot read: ${file}`)
    }
  } else {
    console.error(`Expected ${envValue} cannot find in a file.`)
  }
}

export async function updateAllEnvFile ({
  envValue,
  newValue
}: {
  envValue: string
  newValue: string
}): Promise<string[]> {
  const files = await getEnvFilesRecursively({ directory: getBaseFolder() })
  const effectedServices: string[] = []

  for (const file of files) {
    const fileContents = await readFile({ file })

    if (fileContents !== undefined) {
      const newFileContents = changeValuesInEnv({
        contents: fileContents,
        envValue,
        newValue
      })

      if (newFileContents !== fileContents && newFileContents !== '') {
        await saveFieldVersion(file, envValue, newValue)
        await writeFile({ file, newFileContents })
        effectedServices.push(file)
      }
    }
  }

  return effectedServices
}

export async function updateAllEnvFileInFuzzy ({
  newValue
}: {
  newValue: string
}): Promise<string[]> {
  const files = await getEnvFilesRecursively({ directory: getBaseFolder() })
  const effectedServices: string[] = []

  for (const file of files) {
    const fileContents = await readFile({ file })

    if (fileContents !== undefined) {
      const lines = fileContents.split('\n')
      for (const line of lines) {
        const [currentEnvName, currentEnvValue] = extractEnvVariable(line)

        if (MongoDBURIComparerLogic.compareURIs(currentEnvValue, newValue)) {
          const newFileContents = changeValuesInEnv({
            contents: fileContents,
            envValue: currentEnvName,
            newValue
          })

          await saveFieldVersion(file, currentEnvName, newValue)
          await writeFile({ file, newFileContents })
          effectedServices.push(file)
        }
      }
    }
  }

  return effectedServices
}

export async function getValuesInEnv ({
  targetPath
}: {
  targetPath: string
}): Promise<{ data: string[][] }> {
  const contents = await readFile({ file: targetPath })

  if (contents == null) {
    return { data: [] }
  }
  const lines = contents.split('\n')

  const data: string[][] = []

  for (const line of lines) {
    if (line.trim() !== '') {
      const [envName, envValue] = extractEnvVariable(line)
      data.push([envName, envValue])
    }
  }

  return {
    data
  }
}

export async function compareEnvFiles ({
  source,
  destination
}: {
  source: string
  destination: string
}): Promise<{
    differentVariables: string[][]
    sourceServiceName: string
    destinationServiceName: string
  }> {
  const sourceContent = await readFile({ file: source })
  const destinationContent = await readFile({ file: destination })

  if (sourceContent === null || destinationContent === null) {
    return {
      differentVariables: [],
      sourceServiceName: '',
      destinationServiceName: ''
    }
  }

  const sourceLines = sourceContent?.split('\n')
  const destinationLines = destinationContent?.split('\n')

  const sourceServiceName: string = getServiceNameFromUrl({ targetPath: source })
  const destinationServiceName: string = getServiceNameFromUrl({ targetPath: destination })

  const differentVariables: string[][] = [];

  (sourceLines ?? []).forEach((sourceLine: string) => {
    const sourceLineParts = extractEnvVariable(sourceLine)
    const variableName: string = sourceLineParts[0]
    const sourceValue: string = sourceLineParts[1]

    const matchingDestinationLine: string | undefined = (destinationLines ?? []).find((destinationLine) => {
      const destinationLineParts = extractEnvVariable(destinationLine)
      return destinationLineParts[0] === variableName
    })

    if (matchingDestinationLine != null) {
      const destinationValue = extractEnvVariable(matchingDestinationLine)[1]
      if (sourceValue !== destinationValue) {
        differentVariables.push([variableName, sourceValue, destinationValue])
      }
    }
  })

  return {
    differentVariables,
    sourceServiceName,
    destinationServiceName
  }
}

export async function syncEnvFile (): Promise<boolean> {
  const currentDirectory = process.cwd()
  const directoryName = currentDirectory.split('/').pop() ?? ''
  const serviceFolderPath = path.join(getBaseFolder(), directoryName)

  const currentPathDoesContainEnvFile = await doesFileExist(path.join(currentDirectory, '.env'))

  if (!currentPathDoesContainEnvFile) {
    return false
  }

  const envValues = await getValuesInEnv({ targetPath: path.join(currentDirectory, '.env') })

  await createFolderIfDoesNotExist(serviceFolderPath)
  await copyFile(path.join(currentDirectory, '.env'), path.join(serviceFolderPath, '.env'))
  await deleteFile(path.join(currentDirectory, '.env'))
  await createSymlink({ targetPath: path.join(serviceFolderPath, '.env') })
  await saveFieldVersionsInSync(serviceFolderPath, envValues.data)

  return true
}

export async function promptForEnvVariable (): Promise<string[]> {
  const baseFolder = getBaseFolder()
  const files = await getEnvFiles(baseFolder)

  const variables = new Set<string>()

  for (const file of files) {
    const fileVariables = await readFile({ file })
    if (fileVariables != null) {
      const sourceLines = fileVariables.split('\n')

      for (const line of sourceLines) {
        if (line.trim() !== '') {
          const [envName] = extractEnvVariable(line)
          variables.add(envName)
        }
      }
    }
  }
  const uniqueVariables = Array.from(variables).sort()

  return uniqueVariables
}

export async function getUniqueEnvNames (targetFolder: string): Promise<string[]> {
  const envNames = new Set<string>()

  const fileContent = await readFile({ file: targetFolder })
  if (fileContent != null) {
    const sourceLines = fileContent.split('\n')

    for (const line of sourceLines) {
      if (line.trim() !== '') {
        const [envName] = extractEnvVariable(line)
        envNames.add(envName)
      }
    }
  }

  const uniqueEnvNames = Array.from(envNames).sort()
  return uniqueEnvNames
}

export async function getEnvValue (targetFolder: string, envName: string): Promise<string | undefined> {
  const fileContent = await readFile({ file: targetFolder })
  if (fileContent != null) {
    const sourceLines = fileContent.split('\n')

    for (const line of sourceLines) {
      if (line.trim() !== '') {
        const [currentEnvName, value] = extractEnvVariable(line)
        if (currentEnvName === envName) {
          return value
        }
      }
    }
  }

  return undefined
}

export async function restoreEnvFile (): Promise<boolean> {
  const currentDirectory = process.cwd()
  const directoryName = currentDirectory.split('/').pop() ?? ''
  const serviceFolderPath = path.join(getBaseFolder(), directoryName)
  const versionFilePath = path.join(serviceFolderPath, '.version.json')

  const versionFileContent = await readFile({ file: versionFilePath })

  if (versionFileContent === undefined) {
    console.error('Version file content is undefined.')
    return false
  }

  const versions = JSON.parse(versionFileContent)

  if (!Array.isArray(versions)) {
    console.error('Versions is not an array.')
    return false
  }

  const latestValues: Record<string, string> = {}

  for (let i = 0; i < versions.length; i++) {
    const changes = versions[i]?.changes

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!changes || changes.length === 0) {
      continue
    }

    for (const change of changes) {
      latestValues[change.fieldName] = change.value
    }
  }

  const newEnvContent = Object.entries(latestValues)
    .map(([fieldName, value]) => `${fieldName}=${value}`)
    .join('\n')

  const newEnvFilePath = path.join(serviceFolderPath, '.env')

  await writeFile({ file: newEnvFilePath, newFileContents: newEnvContent })

  await createSymlink({ targetPath: newEnvFilePath })

  return true
}
