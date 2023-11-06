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

async function writeFile ({ file, newFileContents }: { file: string, newFileContents: string }): Promise<void> {
  await fs.promises.writeFile(file, newFileContents, 'utf8')
}

async function deleteFile (filePath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error !== null) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

async function createFolderIfDoesNotExist (folderPath: fs.PathLike): Promise<void> {
  if (!fs.existsSync(folderPath)) {
    await fs.promises.mkdir(folderPath, { recursive: true })
  }
}

async function getFilesRecursively ({ directory }: { directory: string }): Promise<string[]> {
  const files: string[] = []
  const dirents = await fs.promises.readdir(directory, { withFileTypes: true })

  for (const dirent of dirents) {
    const resolvedPath = path.resolve(directory, dirent.name)
    if (dirent.isDirectory()) {
      const subDirFiles = await getFilesRecursively({ directory: resolvedPath })
      files.push(...subDirFiles)
    } else if (dirent.isFile() && dirent.name !== '.DS_Store') {
      files.push(resolvedPath)
    }
  }

  return files
}

async function generateSymlink ({ targetPath, symlinkPath }: { targetPath: string, symlinkPath: string }): Promise<void> {
  await fs.promises.symlink(path.join(targetPath), symlinkPath, 'file')
}

async function copyFile (sourcePath: string, destinationPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    fs.copyFile(sourcePath, destinationPath, (error) => {
      if (error != null) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
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

export {
  getBaseFolder,
  readFile,
  writeFile,
  getFilesRecursively,
  createFolderIfDoesNotExist,
  generateSymlink,
  copyFile,
  deleteFile,
  getEnvFiles
}
