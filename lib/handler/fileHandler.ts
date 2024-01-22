import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

export function getHomePath (): string {
  return os.homedir()
}

export function getEnvolveHomePath (): string {
  return path.join(getHomePath(), '.envolve')
}

export async function symlink (
  source: string,
  destination: string
): Promise<void> {
  await fs.symlink(source, destination, 'file')
}

export async function copyFile (
  source: string,
  destination: string
): Promise<void> {
  await fs.copyFile(source, destination)
}

export async function readFile (
  source: string
): Promise<string> {
  return await fs.readFile(source, 'utf8')
}

export async function writeFile (
  source: string,
  value: string
): Promise<void> {
  await fs.writeFile(source, value, 'utf8')
}

export async function deleteFile (
  source: string
): Promise<void> {
  await fs.unlink(source)
}

export async function createFolder (
  source: string
): Promise<void> {
  if ((await fs.stat(source).catch(() => null)) == null) {
    await fs.mkdir(source, { recursive: true, mode: 0o755 })
  }
}

export async function createFile (
  source: string
): Promise<void> {
  try {
    await fs.access(source)
  } catch (error) {
    await writeFile(source, '[]')
  }
}

export async function getEnvFilesRecursively (directory: string): Promise<string[]> {
  const envFiles: string[] = []
  await readDirectoryFiles(directory, envFiles)
  return envFiles
}

export async function getEnvFiles (baseFolder: string): Promise<string[]> {
  const entries = await fs.readdir(baseFolder, { withFileTypes: true })
  const envFiles: string[] = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderPath = path.join(baseFolder, entry.name)
      const envFilePath = path.join(folderPath, '.env')

      try {
        await readFile(envFilePath)
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

async function readDirectoryFiles (dir: string, envFiles: string[]): Promise<void> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })

  for (const dirent of dirents) {
    const resolvedPath = path.resolve(dir, dirent.name)

    if (dirent.isDirectory()) {
      await readDirectoryFiles(resolvedPath, envFiles)
    } else if (dirent.isFile() && dirent.name === '.env') {
      envFiles.push(resolvedPath)
    }
  }
}
