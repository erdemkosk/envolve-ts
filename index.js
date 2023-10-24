const program = require('commander');
const inquirer = require('inquirer');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

program
  .version('1.0.0')
  .description('Envolve CLI Tool');

program
  .command('c')
  .description('Create a new env file')
  .action(async () => {
    const editorChoices = [
      {
        name: 'Default Editor',
        value: 'default',
      },
      {
        name: 'Visual Studio Code',
        value: 'code',
      },
      {
        name: 'Nano',
        value: 'nano',
      },
      {
        name: 'Vim',
        value: 'vim',
      },
      // Diğer düzenleyicileri buraya ekleyebilirsiniz.
    ];

    const editorAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'editor',
        message: 'Select a text editor:',
        choices: editorChoices,
      },
    ]);

    const { editor } = editorAnswer;

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
        default: '',
        editor: editor === 'default' ? undefined : editor,
      },
    ]);

    const { filename, content } = answers;

    try {
      await fs.promises.writeFile(filename, content, 'utf8');
      console.log(`File "${filename}" created.`);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

program.parse(process.argv);
