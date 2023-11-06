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
  getEnvFiles
} from './file-operations'

async function createEnvFile ({ serviceName, content }: { serviceName: string, content: string }): Promise<void> {
  const serviceFolderPath: string = path.join(getBaseFolder(), serviceName)
  await createFolderIfDoesNotExist(serviceFolderPath)

  const filePath: string = path.join(serviceFolderPath, '.env')
  await writeFile({ file: filePath, newFileContents: content })
}

async function updateEnvFile ({ file, content }: { file: string, content: string }): Promise<void> {
  await writeFile({ file, newFileContents: content })
}

async function updateAllEnvFile ({ oldValue, newValue }: { oldValue: string, newValue: string }): Promise<string[]> {
  const files = await getFilesRecursively({ directory: getBaseFolder() })
  const effectedServices: string[] = []

  for (const file of files) {
    const fileContents = await readFile({ file })

    if (fileContents !== undefined) {
      const newFileContents = changeValuesInEnv({ contents: fileContents, oldValue, newValue })

      if (newFileContents !== fileContents && newFileContents !== '') {
        await writeFile({ file, newFileContents })
        effectedServices.push(file)
      }
    }
  }

  return effectedServices
}

async function createSymlink ({ targetPath }: { targetPath: string }): Promise<string> {
  const symlinkPath: string = path.join(process.cwd(), '.env')

  await generateSymlink({ targetPath: path.join(targetPath), symlinkPath })

  return symlinkPath
}

async function getValuesInEnv ({ targetPath }: { targetPath: string }): Promise<{ data: string[][], config: Record<string, any> }> {
  const contents: string | undefined = await readFile({ file: targetPath })

  if (contents == null) {
    return { data: [], config: {} }
  }
  const lines: string[] = contents.split('\n')

  const data: string[][] = [['ENV', 'VALUE']]

  for (const line of lines) {
    if (line.trim() !== '') {
      const indexOfFirstEqualSign = line.indexOf('=')
      if (indexOfFirstEqualSign >= 0) {
        const envName = line.substring(0, indexOfFirstEqualSign)
        const envValue = line.substring(indexOfFirstEqualSign + 1)

        data.push([envName, envValue])
      }
    }
  }

  const directoryName: string = getServiceNameFromUrl({ targetPath })

  const config = {
    header: {
      alignment: 'center',
      content: directoryName
    }
  }

  return {
    data, config
  }
}

function getServiceNameFromUrl ({ targetPath }: { targetPath: string }): string {
  const parts: string[] = targetPath.split('/')

  return parts[parts.length - 2]
}

function changeValuesInEnv ({ contents, oldValue, newValue }: { contents: string, oldValue: string, newValue: string }): string {
  const lines: string[] = contents.split('\n')
  const newLines: string[] = []

  for (const line of lines) {
    if (line.startsWith(oldValue)) {
      const parts: string[] = line.split('=')
      newLines.push(`${parts[0]}=${newValue}`)
    } else {
      newLines.push(line)
    }
  }

  return newLines.join('\n')
}

async function compareEnvFiles ({ source, destination }: { source: string, destination: string }): Promise<string[][]> {
  const sourceContent: string | undefined = await readFile({ file: source })
  const destinationContent: string | undefined = await readFile({ file: destination })

  if (sourceContent === null || destinationContent === null) {
    return []
  }

  const sourceLines: string[] | undefined = sourceContent?.split('\n')
  const destinationLines: string[] | undefined = destinationContent?.split('\n')

  const sourceServiceName: string = getServiceNameFromUrl({ targetPath: source })
  const destinationServiceName: string = getServiceNameFromUrl({ targetPath: destination })

  const differentVariables: string[][] = [['Variable Name', sourceServiceName, destinationServiceName]];

  // eslint-disable-next-line no-unexpected-multiline
  (sourceLines ?? []).forEach((sourceLine: string) => {
    const sourceLineParts: string[] = sourceLine.split('=')
    const variableName: string = sourceLineParts[0]
    const sourceValue: string = sourceLineParts[1]

    const matchingDestinationLine: string | undefined = (destinationLines ?? []).find((destinationLine) => {
      const destinationLineParts: string[] = destinationLine.split('=')
      return destinationLineParts[0] === variableName
    })

    if (matchingDestinationLine != null) {
      const destinationValue: string = matchingDestinationLine.split('=')[1]
      if (sourceValue !== destinationValue) {
        differentVariables.push([variableName, sourceValue, destinationValue])
      }
    }
  })

  return differentVariables
}

async function syncEnvFile (): Promise<void> {
  const currentDirectory: string = process.cwd()
  const directoryName: string = currentDirectory.split('/').pop() ?? ''
  const serviceFolderPath: string = path.join(getBaseFolder(), directoryName)

  await createFolderIfDoesNotExist(serviceFolderPath)

  await copyFile(path.join(currentDirectory, '.env'), path.join(serviceFolderPath, '.env'))
  await deleteFile(path.join(currentDirectory, '.env'))
  await createSymlink({ targetPath: path.join(serviceFolderPath, '.env') })
}

async function promptForEnvVariable (): Promise<string[]> {
  const baseFolder = getBaseFolder()
  const files = await getEnvFiles(baseFolder)

  const variables = new Set<string>()

  for (const file of files) {
    const fileVariables = await readFile({ file })
    if (fileVariables != null) {
      const sourceLines: string[] = fileVariables.split('\n')

      for (const line of sourceLines) {
        if (line.trim() !== '') {
          const indexOfFirstEqualSign = line.indexOf('=')
          if (indexOfFirstEqualSign >= 0) {
            const envName = line.substring(0, indexOfFirstEqualSign)

            variables.add(envName)
          }
        }
      }
    }
  }
  const uniqueVariables = Array.from(variables)
  uniqueVariables.sort()

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
  promptForEnvVariable
}
