const os = require('os');
const path = require('path');
const fs = require('fs');
const {
  getBaseFolder,
  createFolderIfDoesNotExist,
  getFilesRecursively,
  readFile,
  writeFile,
  generateSymlink,
} = require('../lib/file-operations');

const homedir = os.homedir();
const baseFolder = path.join(homedir, '.envolve');

describe('file-operations', () => {
  describe('getBaseFolder', () => {
    it('should return the base folder path', () => {
      const result = getBaseFolder();
      expect(result).toBe(baseFolder);
    });
  });

  describe('createFolderIfDoesNotExist', () => {
    const folderPath = path.join(baseFolder, 'test-folder');

    beforeEach(() => {
      if (fs.existsSync(folderPath)) {
        fs.rmdirSync(folderPath, { recursive: true });
      }
    });

    it('should create a folder if it does not exist', () => {
      createFolderIfDoesNotExist(folderPath);
      expect(fs.existsSync(folderPath)).toBe(true);
    });

    it('should not throw an error if the folder already exists', () => {
      createFolderIfDoesNotExist(folderPath);
      createFolderIfDoesNotExist(folderPath);
      expect(fs.existsSync(folderPath)).toBe(true);
    });
  });

  describe('getFilesRecursively', () => {
    const tempDir = path.join(os.tmpdir(), 'test-envolve');

    beforeAll(() => {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
    });

    afterAll(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir, { recursive: true });
      }
    });

    it('should return an empty array for an empty directory', async () => {
      const files = await getFilesRecursively({ directory: tempDir });
      expect(files).toEqual([]);
    });

    it('should return an array of file paths for a directory with files', async () => {
      const filePath1 = path.join(tempDir, 'file1.txt');
      const filePath2 = path.join(tempDir, 'file2.txt');
      fs.writeFileSync(filePath1, 'content1');
      fs.writeFileSync(filePath2, 'content2');

      const files = await getFilesRecursively({ directory: tempDir });
      expect(files).toEqual(expect.arrayContaining([filePath1, filePath2]));
    });

    it('should return an array of file paths for a directory with subdirectories and files', async () => {
      const subDir = path.join(tempDir, 'subdir');
      const filePath1 = path.join(subDir, 'file1.txt');
      const filePath2 = path.join(subDir, 'file2.txt');
      const filePath3 = path.join(tempDir, 'file3.txt');
      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(filePath1, 'content1');
      fs.writeFileSync(filePath2, 'content2');
      fs.writeFileSync(filePath3, 'content3');

      const files = await getFilesRecursively({ directory: tempDir });
      expect(files).toEqual(expect.arrayContaining([filePath1, filePath2, filePath3]));
    });
  });

  describe('readFile', () => {
    const filePath = path.join(baseFolder, 'test-file.txt');
    const fileContents = 'test content';

    beforeEach(() => {
      fs.writeFileSync(filePath, fileContents, 'utf8');
    });

    afterEach(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it('should read the content of an existing file', async () => {
      const result = await readFile({ file: filePath });
      expect(result).toBe(fileContents);
    });

    it('should return undefined for a non-existing file', async () => {
      const nonExistentFilePath = path.join(baseFolder, 'non-existent-file.txt');
      const result = await readFile({ file: nonExistentFilePath });
      expect(result).toBeUndefined();
    });
  });

  describe('writeFile', () => {
    const filePath = path.join(baseFolder, 'test-file.txt');
    const newFileContents = 'new test content';

    beforeEach(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it('should write new content to a file', async () => {
      await writeFile({ file: filePath, newFileContents });
      const result = fs.readFileSync(filePath, 'utf8');
      expect(result).toBe(newFileContents);
    });
  });

  describe('generateSymlink', () => {
    const targetPath = path.join(baseFolder, 'target-file.txt');
    const symlinkPath = path.join(baseFolder, 'subfolder', 'symlink-file.txt');

    beforeEach(() => {
      fs.writeFileSync(targetPath, 'target file content', 'utf8');
      if (!fs.existsSync(path.join(baseFolder, 'subfolder'))) {
        fs.mkdirSync(path.join(baseFolder, 'subfolder'));
      }
    });

    afterEach(() => {
      fs.unlinkSync(targetPath);
      fs.unlinkSync(symlinkPath);
    });

    it('should generate a symbolic link', async () => {
      await generateSymlink({ targetPath, symlinkPath });
      const result = fs.lstatSync(symlinkPath).isSymbolicLink();
      expect(result).toBe(true);
    });
  });
});
