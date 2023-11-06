import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const homedir: string = os.homedir()
const baseFolder: string = path.join(homedir, '.envolve')

function getBaseFolder (): string {
  return baseFolder
}

async function readFile ({ file }: { file: string }): Promise<string | undefined> {
  if (fs.existsSync(file)) {
    return await fs.promises.readFile(file, 'utf8')
  }
}

async function writeFile ({
  file,
  newFileContents
}: {
  file: string
  newFileContents: string
}): Promise<void> {
  await fs.promises.writeFile(file, newFileContents, 'utf8')
}

async function deleteFile (filePath: string): Promise<void> {
  await fs.promises.unlink(filePath)
}

async function createFolderIfDoesNotExist (folderPath: fs.PathLike): Promise<void> {
  if (!fs.existsSync(folderPath)) {
    await fs.promises.mkdir(folderPath, { recursive: true, mode: 0o755 })
  }
}

async function getFilesRecursively ({
  directory
}: {
  directory: string
}): Promise<string[]> {
  const files: string[] = []
  await readDir(directory, files)
  return files
}

async function readDir (
  dir: string,
  files: string[]
): Promise<void> {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true })
  for (const dirent of dirents) {
    const resolvedPath = path.resolve(dir, dirent.name)
    if (dirent.isDirectory()) {
      await readDir(resolvedPath, files)
    } else if (dirent.isFile() && dirent.name !== '.DS_Store') {
      files.push(resolvedPath)
    }
  }
}

async function generateSymlink ({
  targetPath,
  symlinkPath
}: {
  targetPath: string
  symlinkPath: string
}): Promise<void> {
  await fs.promises.symlink(targetPath, symlinkPath, 'file')
}

async function copyFile (
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  await fs.promises.copyFile(sourcePath, destinationPath)
}

async function getEnvFiles (baseFolder: string): Promise<string[]> {
  const entries = await fs.promises.readdir(baseFolder, { withFileTypes: true })
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

async function doesFileExist (filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    } else {
      throw err
    }
  }
}

export {
  getBaseFolder,
  readFile,
  writeFile,
  getFilesRecursively,
  createFolderIfDoesNotExist,
  generateSymlink,
  copyFile,
  deleteFile,
  getEnvFiles,
  doesFileExist
}
