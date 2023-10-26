const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const {
  createEnvFile,
  updateEnvFile,
  getFilesRecursively,
  createSymlink,
  baseFolder
} = require('./lib/file-operations');

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
        name: 'servicename',
        message: chalk.green('Enter the service name: '),
      },
      {
        type: 'editor',
        name: 'content',
        message: chalk.green('Enter the env content: '),
      },
    ]);

    const { servicename, content } = answers;

    try {
      await createEnvFile(servicename, content);
      console.log(`File .env created in the "${chalk.blue(servicename)}" directory.`);
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

    await updateEnvFile(oldValue, newValue)

  });

  program
  .command('exec')
  .description('Copy env file to current folder symlink')
  .alias('e')
  .action(async () => {
    const files = await getFilesRecursively(baseFolder);

    const { selectedFile } = await inquirer.prompt({
    type: 'list',
    name: 'selectedFile',
    message: 'Select an .env file to copy:',
    choices: files,
  });

  await createSymlink(selectedFile);
  });


program.parse(process.argv);
