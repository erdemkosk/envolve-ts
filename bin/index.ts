import { Command } from 'commander'
import inquirer from 'inquirer'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
import chalk from 'chalk'
import Table from 'cli-table3'
import packages from '../package.json'
import {
  getBaseFolder,
  getFilesRecursively,
  readFile
} from '../lib/file-operations'

import {
  createEnvFile,
  updateEnvFile,
  updateAllEnvFile,
  createSymlink,
  getValuesInEnv,
  compareEnvFiles,
  syncEnvFile,
  promptForEnvVariable
} from '../lib/env-operations'

const program = new Command()
inquirer.registerPrompt('autocomplete', inquirerPrompt)

program
  .version(packages.version)
  .description(packages.description)

program
  .command('ls')
  .description(`${chalk.yellow('LIST')} environment variables in an .env file for a specific service. Select a service and view its environment variables.`)
  .action(async () => {
    const files = await getFilesRecursively({ directory: getBaseFolder() })

    if (files.length === 0) {
      console.log(`You have not registered any service yet. Go to the file path of the request with your ${chalk.blue('.env')} file in it and run the ${chalk.blue('sync')} command.`)

      return
    }

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to show:',
      choices: files
    })

    const { data } = await getValuesInEnv({ targetPath })

    const table = new Table({
      head: ['ENV', 'VALUE'],
      colWidths: [20, 30],
      wrapOnWordBoundary: false,
      wordWrap: true
    })

    data.forEach(row => {
      table.push(row)
    })

    console.log(table.toString())
  })

program
  .command('sync')
  .description(`${chalk.yellow('SYNC')} backs up your current project's .env file, restores the variables from a global .env file, and creates a symbolic link to the latest environment settings.`)
  .action(async () => {
    const isSuccess = await syncEnvFile()

    isSuccess
      ? console.log(`Synchronization was ${chalk.blue('successful')}. You are ready to go!`)
      : console.log(`There was a ${chalk.red('problem')} synchronizing . Make sure you are on the correct file path and that your file contains an .env file`)
  })

program
  .command('update-all')
  .description(`${chalk.yellow('UPDATE-ALL')} command is a handy utility for updating a specific environment variable across multiple service-specific .env files.`)
  .alias('ua')
  .action(async () => {
    const envOptions = await promptForEnvVariable()

    const { envValue, newValue } = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'envValue',
        message: 'Select the env value to change:',
        source: (answers: any, input: string) => {
          return envOptions.filter(option => option.includes(input))
        }
      },
      {
        type: 'input',
        name: 'newValue',
        message: 'Enter the new value:'
      }
    ])

    const effectedServices = await updateAllEnvFile({ envValue, newValue })

    effectedServices.forEach((service) => {
      console.log(`Environment variables updated in "${chalk.blue(service)}"`)
    })
  })

program
  .command('compare')
  .description(`${chalk.yellow('COMPARE')} command is a handy utility for differences in two different files with the same variable.`)
  .alias('comp')
  .action(async () => {
    const files: string [] = await getFilesRecursively({ directory: getBaseFolder() })

    if (files.length < 2) {
      console.log(`You must have a minimum of ${chalk.blue('2')} services registered to compare.`)

      return
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'source',
        message: 'Source',
        choices: files
      },
      {
        type: 'list',
        name: 'destination',
        message: 'Destination',
        choices: (answers) => {
          const sourceValue = answers.source
          return files.filter((file) => file !== sourceValue)
        }
      }
    ])

    const { source, destination } = answers

    const {
      differentVariables,
      sourceServiceName,
      destinationServiceName
    } = await compareEnvFiles({ source, destination })

    const table = new Table({
      head: ['VALUES', sourceServiceName, destinationServiceName],
      wordWrap: true,
      colWidths: [20, 30, 30],
      wrapOnWordBoundary: false
    })

    differentVariables.forEach(row => {
      table.push(row)
    })

    if (differentVariables.length > 0) {
      console.log(table.toString())
    }
  })

program
  .command('create')
  .description('CREATE a new env file')
  .alias('c')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'serviceName',
        message: chalk.green('Enter the service name: ')
      },
      {
        type: 'editor',
        name: 'content',
        message: chalk.green('Enter the env content: ')
      }
    ])

    const { serviceName, content } = answers

    try {
      await createEnvFile({ serviceName, content })

      console.log(`File .env created for the "${chalk.blue(serviceName)}" service.`)
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })

program
  .command('copy')
  .description('COPY env file to current folder symlink')
  .alias('cp')
  .action(async () => {
    const files = await getFilesRecursively({ directory: getBaseFolder() })

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to copy:',
      choices: files
    })

    const symlinkPath = await createSymlink({ targetPath })

    console.log(`Symbolic link created: "${chalk.blue(symlinkPath)}"`)
  })

program
  .command('update')
  .description('UPDATE a single env file')
  .alias('u')
  .action(async () => {
    const files = await getFilesRecursively({ directory: getBaseFolder() })

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to show:',
      choices: files
    })

    const existingContent = await readFile({ file: targetPath })

    const { content } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'content',
        message: chalk.green('Edit the env content:'),
        default: existingContent
      }
    ])

    try {
      await updateEnvFile({ file: targetPath, content })
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })

program.parse(process.argv)
