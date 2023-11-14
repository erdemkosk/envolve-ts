import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

const homedir: string = os.homedir()
const baseFolder: string = path.join(homedir, '.envolve')

async function readDir (dir: string, envFiles: string[]): Promise<void> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })

  for (const dirent of dirents) {
    const resolvedPath = path.resolve(dir, dirent.name)

    if (dirent.isDirectory()) {
      await readDir(resolvedPath, envFiles)
    } else if (dirent.isFile() && dirent.name === '.env') {
      envFiles.push(resolvedPath)
    }
  }
}

export function getBaseFolder (): string {
  return baseFolder
}

export async function readFile ({ file }: { file: string }): Promise<string | undefined> {
  try {
    return await fs.readFile(file, 'utf8')
  } catch (error) {
    return undefined
  }
}

export async function writeFile ({
  file,
  newFileContents
}: {
  file: string
  newFileContents: string
}): Promise<void> {
  await fs.writeFile(file, newFileContents, 'utf8')
}

export async function deleteFile (filePath: string): Promise<void> {
  await fs.unlink(filePath)
}

export async function createFolderIfDoesNotExist (folderPath: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!(await fs.stat(folderPath).catch(() => null))) {
    await fs.mkdir(folderPath, { recursive: true, mode: 0o755 })
  }
}

export async function createFileIfNotExists (filePath: string, initialContent: string = '[]'): Promise<void> {
  try {
    await fs.access(filePath)
  } catch (error) {
    await fs.writeFile(filePath, initialContent, 'utf8')
  }
}

export async function getEnvFilesRecursively ({ directory }: { directory: string }): Promise<string[]> {
  const envFiles: string[] = []
  await readDir(directory, envFiles)
  return envFiles
}

export async function generateSymlink ({
  targetPath,
  symlinkPath
}: {
  targetPath: string
  symlinkPath: string
}): Promise<void> {
  await fs.symlink(targetPath, symlinkPath, 'file')
}

export async function copyFile (
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  await fs.copyFile(sourcePath, destinationPath)
}

export async function getEnvFiles (baseFolder: string): Promise<string[]> {
  const entries = await fs.readdir(baseFolder, { withFileTypes: true })
  const envFiles: string[] = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderPath = path.join(baseFolder, entry.name)
      const envFilePath = path.join(folderPath, '.env')

      try {
        await readFile({ file: envFilePath })
        envFiles.push(envFilePath)
      } catch (error) {
        continue
      }
    }
  }

  return envFiles
}

export async function doesFileExist (filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.F_OK)
    return true
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    } else {
      throw err
    }
  }
}
