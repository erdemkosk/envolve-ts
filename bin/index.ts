import { Command as CommanderCommand } from 'commander'
import inquirer from 'inquirer'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
import chalk from 'chalk'
import packages from '../package.json'

import {
  CommandInvoker,
  type Command,
  LsCommand,
  SyncCommand,
  UpdateAllCommand,
  CompareCommand,
  UpdateCommand,
  RevertCommand,
  RestoreCommand
} from '../lib/command'

const program = new CommanderCommand()
inquirer.registerPrompt('autocomplete', inquirerPrompt)

program
  .version(packages.version)
  .description(packages.description)

program
  .command('ls')
  .description(`${chalk.yellow('LIST')} environment variables in an .env file for a specific service. Select a service and view its environment variables.`)
  .action(async () => {
    const command: Command = new LsCommand()
    CommandInvoker.executeCommands(command)
  })

program
  .command('sync')
  .description(`${chalk.yellow('SYNC')} backs up your current project's .env file, restores the variables from a global .env file, and creates a symbolic link to the latest environment settings.`)
  .action(async () => {
    const command: Command = new SyncCommand()
    CommandInvoker.executeCommands(command)
  })

program
  .command('update-all')
  .description(`${chalk.yellow('UPDATE-ALL')} occurrences of a specific environment variable across multiple service-specific .env files.`)
  .alias('ua')
  .action(async () => {
    const command: Command = new UpdateAllCommand()
    CommandInvoker.executeCommands(command)
  })

program
  .command('compare')
  .description(`${chalk.yellow('COMPARE')} command is a handy utility for differences in two different files with the same variable.`)
  .alias('comp')
  .action(async () => {
    const command: Command = new CompareCommand()
    CommandInvoker.executeCommands(command)
  })

program
  .command('update')
  .description(`${chalk.yellow('UPDATE')} a single field in .env file and create a version.`)
  .alias('u')
  .action(async () => {
    const command: Command = new UpdateCommand()
    CommandInvoker.executeCommands(command)
  })

program
  .command('revert')
  .description(`${chalk.yellow('REVERT')} a field in .env file to a specific version`)
  .alias('r')
  .action(async () => {
    const command: Command = new RevertCommand()
    CommandInvoker.executeCommands(command)
  })

program
  .command('restore-env')
  .description(`${chalk.yellow('RESTORE')} the .env file based on the latest changes in the version.json file.`)
  .action(async () => {
    const command: Command = new RestoreCommand()
    CommandInvoker.executeCommands(command)
  })

program.parse(process.argv)
