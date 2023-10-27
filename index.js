const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');

const {
  getBaseFolder,
  getFilesRecursively,
  readFile
} = require('./lib/file-operations');

const {
  createEnvFile,
  updateEnvFile,
  updateAllEnvFile,
  createSymlink,
  getValuesInEnv
} = require('./lib/env-operations');

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

    await updateAllEnvFile({ oldValue, newValue })

  });

program
  .command('exec')
  .description('COPY env file to current folder symlink')
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

    const existingContent =  await readFile({file: targetPath});

    const { content } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'content',
        message: chalk.green('Edit the env content:'),
        default: existingContent,
      },
    ]);
  
    try {
      await updateEnvFile({ file : targetPath, content });
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });


program.parse(process.argv);
