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
