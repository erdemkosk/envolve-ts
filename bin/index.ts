import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import { table } from 'table'
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
  syncEnvFile
} from '../lib/env-operations'

const program = new Command()

program
  .version(packages.version)
  .description(packages.description)

program
  .command('ls')
  .description(`${chalk.yellow('LIST')} environment variables in an .env file for a specific service. Select a service and view its environment variables.`)
  .action(async () => {
    const files = await getFilesRecursively({ directory: getBaseFolder() })

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to show:',
      choices: files
    })

    const { data, config } = await getValuesInEnv({ targetPath })

    console.log(table(data, config))
  })

program
  .command('sync')
  .description(`${chalk.yellow('SYNC')} backs up your current project's .env file, restores the variables from a global .env file, and creates a symbolic link to the latest environment settings.`)
  .action(async () => {
    await syncEnvFile()
  })

program
  .command('update-all')
  .description(`${chalk.yellow('UPDATE-ALL')} command is a handy utility for updating a specific environment variable across multiple service-specific .env files.`)
  .alias('ua')
  .action(async () => {
    const { oldValue, newValue } = await inquirer.prompt([
      {
        type: 'input',
        name: 'oldValue',
        message: 'Enter the old value to change:'
      },
      {
        type: 'input',
        name: 'newValue',
        message: 'Enter the new value:'
      }
    ])

    const effectedServices = await updateAllEnvFile({ oldValue, newValue })

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

    const differentVariables = await compareEnvFiles({ source, destination })

    console.log(differentVariables.length > 1 ? table(differentVariables) : chalk.red('There is no diff or two different files do not contain the same variable name'))
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