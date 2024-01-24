import * as path from 'path'
import {
  getHomePath,
  getEnvolveHomePath,
  createFolder,
  getEnvFilesRecursively,
  readFile,
  writeFile,
  symlink,
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

function getServiceNameFromUrl (targetPath: string): string {
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

function changeValuesInEnv (
  contents: string,
  envValue: string,
  newValue: string
): string {
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

async function createSymlink (
  targetPath: string
): Promise<string> {
  const symlinkPath = path.join(process.cwd(), '.env')
  await symlink(path.join(targetPath), symlinkPath)
  return symlinkPath
}

export async function updateEnvFile (
  file: string,
  envValue: string,
  newValue: string
): Promise<void> {
  const oldValue = await getEnvValue(file, envValue)

  if (oldValue !== undefined) {
    const updatedFileContent = await readFile(file)

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

      await writeFile(
        file,
        updatedLines.join('\n')
      )
    } else {
      console.error(`File cannot read: ${file}`)
    }
  } else {
    console.error(`Expected ${envValue} cannot find in a file.`)
  }
}

export async function updateAllEnvFile (
  envValue: string,
  newValue: string
): Promise<string[]> {
  const files = await getEnvFilesRecursively(getEnvolveHomePath())
  const effectedServices: string[] = []

  for (const file of files) {
    const fileContents = await readFile(file)

    if (fileContents !== undefined) {
      const newFileContents = changeValuesInEnv(
        fileContents,
        envValue,
        newValue
      )

      if (newFileContents !== fileContents && newFileContents !== '') {
        await saveFieldVersion(file, envValue, newValue)
        await writeFile(file, newFileContents)
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
  const files = await getEnvFilesRecursively(getHomePath())
  const effectedServices: string[] = []

  for (const file of files) {
    const fileContents = await readFile(file)

    if (fileContents !== undefined) {
      const lines = fileContents.split('\n')
      for (const line of lines) {
        const [currentEnvName, currentEnvValue] = extractEnvVariable(line)

        if (MongoDBURIComparerLogic.compareURIs(currentEnvValue, newValue)) {
          const newFileContents = changeValuesInEnv(
            fileContents,
            currentEnvName,
            newValue
          )

          await saveFieldVersion(file, currentEnvName, newValue)
          await writeFile(file, newFileContents)
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
  const contents = await readFile(targetPath)

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

export async function compareEnvFiles (
  source: string,
  destination: string
): Promise<{
    differentVariables: string[][]
    sourceServiceName: string
    destinationServiceName: string
  }> {
  const sourceContent = await readFile(source)
  const destinationContent = await readFile(destination)

  if (sourceContent === null || destinationContent === null) {
    return {
      differentVariables: [],
      sourceServiceName: '',
      destinationServiceName: ''
    }
  }

  const sourceLines = sourceContent?.split('\n')
  const destinationLines = destinationContent?.split('\n')

  const sourceServiceName: string = getServiceNameFromUrl(source)
  const destinationServiceName: string = getServiceNameFromUrl(destination)

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
  const serviceFolderPath = path.join(getEnvolveHomePath(), directoryName)

  const currentPathDoesContainEnvFile = await doesFileExist(path.join(currentDirectory, '.env'))

  console.log(serviceFolderPath)

  if (!currentPathDoesContainEnvFile) {
    return false
  }

  const envValues = await getValuesInEnv({ targetPath: path.join(currentDirectory, '.env') })

  await createFolder(serviceFolderPath)
  await copyFile(path.join(currentDirectory, '.env'), path.join(serviceFolderPath, '.env'))
  await deleteFile(path.join(currentDirectory, '.env'))
  await createSymlink(path.join(serviceFolderPath, '.env'))
  await saveFieldVersionsInSync(serviceFolderPath, envValues.data)

  return true
}

export async function promptForEnvVariable (): Promise<string[]> {
  const files = await getEnvFiles(getEnvolveHomePath())

  const variables = new Set<string>()

  for (const file of files) {
    const fileVariables = await readFile(file)
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

  const fileContent = await readFile(targetFolder)
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
  const fileContent = await readFile(targetFolder)
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
  const serviceFolderPath = path.join(getEnvolveHomePath(), directoryName)

  console.log(serviceFolderPath)

  const symlinkPath = path.join(serviceFolderPath, '.env')

  const destinationPath = path.join(currentDirectory, '.env')

  await symlink(symlinkPath, destinationPath)

  return true
}

export async function generateEnvExampleFile (): Promise<boolean> {
  const currentDirectory = process.cwd()

  const currentPathDoesContainEnvFile = await doesFileExist(path.join(currentDirectory, '.env'))

  if (!currentPathDoesContainEnvFile) {
    return false
  }

  const envValues = await getValuesInEnv({ targetPath: path.join(currentDirectory, '.env') })

  const result = envValues.data.map(innerArr => innerArr[0] !== '' ? innerArr[0]  + '=' : '').join('\n')

  await writeFile(path.join(currentDirectory, '.env-example'), result)

  return true
}
