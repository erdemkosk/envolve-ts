import * as path from 'path'

import { type IEnvVersion } from '../interfaces/env-version'

import {
  createFile,
  readFile,
  writeFile
} from './fileHandler'

import {
  getEnvValue
} from './envHandler'

export async function saveFieldVersion (targetPath: string, fieldName: string, value: string): Promise<void> {
  const versionFilePath = path.join(path.dirname(targetPath), '.version.json')

  await createFile(versionFilePath)

  const versionFileContent = await readFile(versionFilePath)

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

    await writeFile(
      versionFilePath,
      JSON.stringify(versions, null, 2)
    )
  } else {
    console.error('Version file content is undefined.')
  }
}

export async function saveFieldVersionsInSync (serviceFolderPath: string, envValues: string[][] | undefined): Promise<void> {
  if (envValues === undefined) {
    console.error('Env values are undefined.')
    return
  }

  const versionFilePath = path.join(serviceFolderPath, '.version.json')
  await createFile(versionFilePath)

  const versionFileContent = await readFile(versionFilePath)

  let versions = versionFileContent !== undefined ? JSON.parse(versionFileContent) : []

  if (!Array.isArray(versions)) {
    versions = []
  }

  for (const [fieldName, value] of envValues) {
    const oldValue = await getEnvValue(path.join(serviceFolderPath, '.env'), fieldName)

    const newVersion = {
      timestamp: new Date().toISOString(),
      changes: [{ fieldName, oldValue, value }]
    }

    versions.push(newVersion)
  }

  await writeFile(
    versionFilePath,
    JSON.stringify(versions, null, 2)
  )
}

export async function getEnvVersions (targetPath: string, fieldName: string): Promise<IEnvVersion[]> {
  const versionFilePath = path.join(path.dirname(targetPath), '.version.json')
  const versionFileContent = await readFile(versionFilePath)

  if (versionFileContent !== undefined) {
    const versions: IEnvVersion[] = JSON.parse(versionFileContent)

    const sortedVersions = versions
      .filter(version => {
        const fieldChange = version.changes.find(change => change.fieldName === fieldName)
        return fieldChange !== undefined
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return sortedVersions
  } else {
    console.error('Version file content is undefined.')
    return []
  }
}
