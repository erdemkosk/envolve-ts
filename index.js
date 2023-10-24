const program = require('commander');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

program
  .version('1.0.0')
  .description('Envolve CLI Tool');

program
  .command('create')
  .description('Create a new env file')
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
      const serviceFolderPath = path.join(__dirname, servicename);
      if (!fs.existsSync(serviceFolderPath)) {
        fs.mkdirSync(serviceFolderPath);
      }

      await fs.promises.writeFile(path.join(serviceFolderPath, '.env'), content, 'utf8');
      console.log(`File .env created in the "${chalk.blue(servicename)}" directory.`);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

program.parse(process.argv);
