import * as path from 'path'

import { type IEnvVersion } from './interfaces/env-version'

import {
  createFileIfNotExists,
  readFile,
  writeFile
} from './file-operations'

import {
  getEnvValue
} from './env-operations'

export async function saveFieldVersion (targetPath: string, fieldName: string, value: string): Promise<void> {
  const versionFilePath = path.join(path.dirname(targetPath), 'version.json')

  await createFileIfNotExists(versionFilePath)

  const versionFileContent = await readFile({ file: versionFilePath })

  if (versionFileContent !== undefined) {
    let versions = JSON.parse(versionFileContent)

    if (!Array.isArray(versions)) {
      versions = []
    }

    const oldValue = await getEnvValue(targetPath, fieldName)

    const newVersion = {
      timestamp: new Date().toISOString(),
      changes: [{ fieldName, oldValue, value }]
    }

    versions.push(newVersion)

    await writeFile({
      file: versionFilePath,
      newFileContents: JSON.stringify(versions, null, 2)
    })
  } else {
    console.error('Version file content is undefined.')
  }
}

export async function saveFieldVersionsInSync (serviceFolderPath: string, envValues: string[][] | undefined): Promise<void> {
  if (envValues === undefined) {
    console.error('Env values are undefined.')
    return
  }

  const versionFilePath = path.join(serviceFolderPath, 'version.json')
  await createFileIfNotExists(versionFilePath)

  const versionFileContent = await readFile({ file: versionFilePath })

  let versions = versionFileContent !== undefined ? JSON.parse(versionFileContent) : []

  if (!Array.isArray(versions)) {
    versions = []
  }

  for (const [fieldName, value] of envValues) {
    const oldValue = await getEnvValue(path.join(serviceFolderPath, '.env'), fieldName)

    console.log(oldValue)

    const newVersion = {
      timestamp: new Date().toISOString(),
      changes: [{ fieldName, oldValue, value }]
    }

    versions.push(newVersion)
  }

  await writeFile({
    file: versionFilePath,
    newFileContents: JSON.stringify(versions, null, 2)
  })
}

export async function getEnvVersions (targetPath: string, fieldName: string): Promise<IEnvVersion[]> {
  const versionFilePath = path.join(path.dirname(targetPath), 'version.json')
  const versionFileContent = await readFile({ file: versionFilePath })

  if (versionFileContent !== undefined) {
    const versions: IEnvVersion[] = JSON.parse(versionFileContent)

    return versions.filter(version => {
      const fieldChange = version.changes.find(change => change.fieldName === fieldName)
      return fieldChange !== undefined
    })
  } else {
    console.error('Version file content is undefined.')
    return []
  }
}
