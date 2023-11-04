/* eslint-disable no-console */
const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { table } = require('table');

const {
  getBaseFolder,
  getFilesRecursively,
  readFile,
} = require('../lib/file-operations');

const {
  createEnvFile,
  updateEnvFile,
  updateAllEnvFile,
  createSymlink,
  getValuesInEnv,
  compareEnvFiles,
} = require('../lib/env-operations');

program
  .version('1.0.0')
  .description('Envolve CLI Tool');

program
  .command('create')
  .description('CREATE a new env file')
  .alias('c')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'serviceName',
        message: chalk.green('Enter the service name: '),
      },
      {
        type: 'editor',
        name: 'content',
        message: chalk.green('Enter the env content: '),
      },
    ]);

    const { serviceName, content } = answers;

    try {
      await createEnvFile({ serviceName, content });

      console.log(`File .env created for the "${chalk.blue(serviceName)}" service.`);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

program
  .command('update-all')
  .description('UPDATE single value on each related service env')
  .alias('ua')
  .action(async () => {
    const { oldValue, newValue } = await inquirer.prompt([
      {
        type: 'input',
        name: 'oldValue',
        message: 'Enter the old value to change:',
      },
      {
        type: 'input',
        name: 'newValue',
        message: 'Enter the new value:',
      },
    ]);

    const effectedServices = await updateAllEnvFile({ oldValue, newValue });

    effectedServices.forEach((service) => {
      console.log(`Environment variables updated in "${chalk.blue(service)}"`);
    });
  });

program
  .command('copy')
  .description('COPY env file to current folder symlink')
  .alias('cp')
  .action(async () => {
    const files = await getFilesRecursively({ directory: getBaseFolder() });

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to copy:',
      choices: files,
    });

    const symlinkPath = await createSymlink({ targetPath });

    console.log(`Symbolic link created: "${chalk.blue(symlinkPath)}"`);
  });

program
  .command('show')
  .description('SHOW env file to related service name')
  .alias('sh')
  .action(async () => {
    const files = await getFilesRecursively({ directory: getBaseFolder() });

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to show:',
      choices: files,
    });

    const { data, config } = await getValuesInEnv({ targetPath });

    console.log(table(data, config));
  });

program
  .command('update')
  .description('UPDATE a single env file')
  .alias('u')
  .action(async () => {
    const files = await getFilesRecursively({ directory: getBaseFolder() });

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to show:',
      choices: files,
    });

    const existingContent = await readFile({ file: targetPath });

    const { content } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'content',
        message: chalk.green('Edit the env content:'),
        default: existingContent,
      },
    ]);

    try {
      await updateEnvFile({ file: targetPath, content });
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

program
  .command('compare')
  .description('COMPARE differences in two different files with the same variable')
  .alias('comp')
  .action(async () => {
    const files = await getFilesRecursively({ directory: getBaseFolder() });

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'source',
        message: 'Source',
        choices: files,
      },
      {
        type: 'list',
        name: 'destination',
        message: 'Destination',
        // eslint-disable-next-line no-shadow
        choices: (answers) => {
          // Kullanıcının 'source' seçimine bağlı olarak 'destination' seçeneklerini filtrele
          const sourceValue = answers.source;
          return files.filter((file) => file !== sourceValue);
        },
      },
    ]);

    const { source, destination } = answers;

    const differentVariables = await compareEnvFiles({ source, destination });

    console.log(differentVariables.length > 1 ? table(differentVariables) : chalk.red('There is no diff or two different files do not contain the same variable name'));
  });

program.parse(process.argv);
