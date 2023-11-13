import { Command } from 'commander'
import inquirer from 'inquirer'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
import chalk from 'chalk'
import Table from 'cli-table3'
import packages from '../package.json'
import {
  getBaseFolder,
  getEnvFilesRecursively
} from '../lib/file-operations'

import {
  updateEnvFile,
  updateAllEnvFile,
  getValuesInEnv,
  compareEnvFiles,
  syncEnvFile,
  promptForEnvVariable,
  getUniqueEnvNames
} from '../lib/env-operations'

import {
  getEnvVersions
} from '../lib/history-operations'

import { format } from 'date-fns'

const program = new Command()
inquirer.registerPrompt('autocomplete', inquirerPrompt)

program
  .version(packages.version)
  .description(packages.description)

program
  .command('ls')
  .description(`${chalk.yellow('LIST')} environment variables in an .env file for a specific service. Select a service and view its environment variables.`)
  .action(async () => {
    const files = await getEnvFilesRecursively({ directory: getBaseFolder() })

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
          if (input === undefined) {
            return envOptions
          }

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
    const files: string [] = await getEnvFilesRecursively({ directory: getBaseFolder() })

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
  .command('update')
  .description('UPDATE a single field in .env file and create a version')
  .alias('u')
  .action(async () => {
    const files = await getEnvFilesRecursively({ directory: getBaseFolder() })

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to show:',
      choices: files
    })

    const envOptions = await getUniqueEnvNames(targetPath)

    const { envValue, newValue } = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'envValue',
        message: 'Select the env value to change:',
        source: (answers: any, input: string) => {
          if (input === undefined) {
            return envOptions
          }

          return envOptions.filter(option => option.includes(input))
        }
      },
      {
        type: 'input',
        name: 'newValue',
        message: 'Enter the new value:'
      }
    ])

    try {
      await updateEnvFile({ file: targetPath, envValue, newValue })
      console.log(`Environment variables updated in "${chalk.blue(targetPath)}"`)
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })

program
  .command('restore')
  .description('Restore a field in .env file to a specific version')
  .alias('r')
  .action(async () => {
    const files = await getEnvFilesRecursively({ directory: getBaseFolder() })

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to restore:',
      choices: files
    })

    const envOptions = await getUniqueEnvNames(targetPath)

    const { envValue } = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'envValue',
        message: 'Select the env value to change:',
        source: async (answers: any, input: string) => {
          if (input === undefined) {
            return envOptions
          }

          const filteredOptions = envOptions.filter(option => option.includes(input))

          return filteredOptions
        }
      }
    ])

    const versions = await getEnvVersions(targetPath, envValue)
    const { version } = await inquirer.prompt({
      type: 'list',
      name: 'version',
      message: 'Select a version to restore:',
      choices: versions.map((version: { timestamp: any, changes: Array<{ oldValue: any }> }) => {
        const formattedTimestamp = format(new Date(version.timestamp), 'yyyy-MM-dd HH:mm:ss')
        return {
          name: `Version ${formattedTimestamp} - ${version.changes[0].oldValue}`,
          value: version
        }
      })
    })

    try {
      await updateEnvFile({ file: targetPath, envValue, newValue: version.changes[0].oldValue })
      console.log(`Environment variables restored in "${chalk.blue(targetPath)}"`)
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })

program.parse(process.argv)
