import * as path from 'path'
import {
  getBaseFolder,
  createFolderIfDoesNotExist,
  getFilesRecursively,
  readFile,
  writeFile,
  generateSymlink,
  copyFile,
  deleteFile,
  getEnvFiles,
  doesFileExist
} from './file-operations'

function getServiceNameFromUrl ({ targetPath }: { targetPath: string }): string {
  const parts = targetPath.split('/')
  return parts[parts.length - 2]
}

function splitEnvLine (line: string): [string, string] {
  const indexOfFirstEqualSign = line.indexOf('=')
  if (indexOfFirstEqualSign >= 0) {
    const envName = line.substring(0, indexOfFirstEqualSign)
    const envValue = line.substring(indexOfFirstEqualSign + 1)
    return [envName, envValue]
  }
  return ['', '']
}

async function createEnvFile ({
  serviceName,
  content
}: {
  serviceName: string
  content: string
}): Promise<void> {
  const serviceFolderPath = path.join(getBaseFolder(), serviceName)
  await createFolderIfDoesNotExist(serviceFolderPath)

  const filePath = path.join(serviceFolderPath, '.env')
  await writeFile({ file: filePath, newFileContents: content })
}

async function updateEnvFile ({
  file,
  content
}: {
  file: string
  content: string
}): Promise<void> {
  await writeFile({ file, newFileContents: content })
}

async function updateAllEnvFile ({
  envValue,
  newValue
}: {
  envValue: string
  newValue: string
}): Promise<string[]> {
  const files = await getFilesRecursively({ directory: getBaseFolder() })
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
        await writeFile({ file, newFileContents })
        effectedServices.push(file)
      }
    }
  }

  return effectedServices
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

async function getValuesInEnv ({
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
      const [envName, envValue] = splitEnvLine(line)
      data.push([envName, envValue])
    }
  }

  return {
    data
  }
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

async function compareEnvFiles ({
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
    const sourceLineParts = splitEnvLine(sourceLine)
    const variableName: string = sourceLineParts[0]
    const sourceValue: string = sourceLineParts[1]

    const matchingDestinationLine: string | undefined = (destinationLines ?? []).find((destinationLine) => {
      const destinationLineParts = splitEnvLine(destinationLine)
      return destinationLineParts[0] === variableName
    })

    if (matchingDestinationLine != null) {
      const destinationValue = splitEnvLine(matchingDestinationLine)[1]
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

async function syncEnvFile (): Promise<boolean> {
  const currentDirectory = process.cwd()
  const directoryName = currentDirectory.split('/').pop() ?? ''
  const serviceFolderPath = path.join(getBaseFolder(), directoryName)

  const currentPathDoesContainEnvFile = await doesFileExist(path.join(currentDirectory, '.env'))

  if (!currentPathDoesContainEnvFile) {
    return false
  }

  await createFolderIfDoesNotExist(serviceFolderPath)

  await copyFile(path.join(currentDirectory, '.env'), path.join(serviceFolderPath, '.env'))
  await deleteFile(path.join(currentDirectory, '.env'))
  await createSymlink({ targetPath: path.join(serviceFolderPath, '.env') })

  return true
}

async function promptForEnvVariable (): Promise<string[]> {
  const baseFolder = getBaseFolder()
  const files = await getEnvFiles(baseFolder)

  const variables = new Set<string>()

  for (const file of files) {
    const fileVariables = await readFile({ file })
    if (fileVariables != null) {
      const sourceLines = fileVariables.split('\n')

      for (const line of sourceLines) {
        if (line.trim() !== '') {
          const [envName] = splitEnvLine(line)
          variables.add(envName)
        }
      }
    }
  }
  const uniqueVariables = Array.from(variables).sort()

  return uniqueVariables
}

export {
  createEnvFile,
  updateEnvFile,
  updateAllEnvFile,
  createSymlink,
  getValuesInEnv,
  compareEnvFiles,
  syncEnvFile,
  promptForEnvVariable,
  getServiceNameFromUrl,
  splitEnvLine
}
