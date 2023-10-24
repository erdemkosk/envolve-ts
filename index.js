const program = require('commander');
const inquirer = require('inquirer');
const fs = require('fs');

program
  .version('1.0.0')
  .description('Envolve CLI Tool');

program
  .command('c')
  .description('Create a new env file')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'filename',
        message: 'Enter the env name: ',
      },
      {
        type: 'editor',
        name: 'content',
        message: 'Enter the env content: ',
      },
    ]);

    const { servicename, filename, content } = answers;

    try {
      await fs.promises.writeFile(`${filename}`, content, 'utf8');
      console.log(`File "${filename}" created in the "${servicename}" directory.`);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

program.parse(process.argv);
