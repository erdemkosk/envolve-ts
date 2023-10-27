const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');

const {
  getBaseFolder,
  getFilesRecursively
} = require('./lib/file-operations');

const {
  createEnvFile,
  updateEnvFile,
  createSymlink,
  getValuesInEnv
} = require('./lib/env-operations');

program
  .version('1.0.0')
  .description('Envolve CLI Tool');

program
  .command('create')
  .description('Create a new env file')
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
      console.log(`File .env created in the "${chalk.blue(serviceName)}" directory.`);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

program
  .command('update')
  .description('Change value on envs')
  .alias('u')
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

    await updateEnvFile({ oldValue, newValue })

  });

program
  .command('exec')
  .description('Copy env file to current folder symlink')
  .alias('e')
  .action(async () => {
    const files = await getFilesRecursively({ directory: getBaseFolder() });

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to copy:',
      choices: files,
    });

    await createSymlink({ targetPath });
  });

program
  .command('get')
  .description('GET env file to related service name')
  .alias('g')
  .action(async () => {
    const files = await getFilesRecursively({ directory: getBaseFolder() });

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to show:',
      choices: files,
    });

    await getValuesInEnv({ targetPath });
  });


program.parse(process.argv);
