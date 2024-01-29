import { Command as CommanderCommand } from 'commander'
import inquirer from 'inquirer'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
import chalk from 'chalk'
import packages from '../package.json'

import CommandFactory from '../lib/command/commandFactory'

import type Command from '../lib/command/command'
import CommandInvoker from '../lib/command/commandInvoker'
import { CommandTypes } from '../lib/const'
import updateNotifier from 'update-notifier'

updateNotifier({ pkg: packages }).notify()

const program = new CommanderCommand()
inquirer.registerPrompt('autocomplete', inquirerPrompt)

const factory: CommandFactory = new CommandFactory()

program
  .version(packages.version)
  .description(packages.description)

program
  .command('ls')
  .description(`${chalk.yellow('LIST')} environment variables in an .env file for a specific service. Select a service and view its environment variables.`)
  .action(async () => {
    const command: Command | null = factory.createCommand(CommandTypes.LS)
    command !== null && CommandInvoker.executeCommands(command)
  })

program
  .command('sync')
  .description(`${chalk.yellow('SYNC')} backs up your current project's .env file, restores the variables from a global .env file, and creates a symbolic link to the latest environment settings.`)
  .action(async () => {
    const command: Command | null = factory.createCommand(CommandTypes.SYNC)
    command !== null && CommandInvoker.executeCommands(command)
  })

program
  .command('update-all')
  .description(`${chalk.yellow('UPDATE-ALL')} occurrences of a specific environment variable across multiple service-specific .env files.`)
  .alias('ua')
  .option('-f, --fuzzy [value]', 'without naming the env value, mongo db etc. automatically detects the small changing parts of the derivative urls and changes them all.e')
  .action(async (cmd) => {
    const command: Command | null = factory.createCommand(CommandTypes.UPDATE_ALL, cmd.fuzzy)
    command !== null && CommandInvoker.executeCommands(command)
  })

program
  .command('compare')
  .description(`${chalk.yellow('COMPARE')} command is a handy utility for differences in two different files with the same variable.`)
  .alias('comp')
  .action(async () => {
    const command: Command | null = factory.createCommand(CommandTypes.COMPARE)
    command !== null && CommandInvoker.executeCommands(command)
  })

program
  .command('update')
  .description(`${chalk.yellow('UPDATE')} a single field in .env file and create a version.`)
  .alias('u')
  .action(async () => {
    const command: Command | null = factory.createCommand(CommandTypes.UPDATE)
    command !== null && CommandInvoker.executeCommands(command)
  })

program
  .command('revert')
  .description(`${chalk.yellow('REVERT')} a field in .env file to a specific version`)
  .alias('r')
  .action(async () => {
    const command: Command | null = factory.createCommand(CommandTypes.REVERT)
    command !== null && CommandInvoker.executeCommands(command)
  })

program
  .command('restore-env')
  .description(`${chalk.yellow('RESTORE')} env file if u remove your env`)
  .action(async () => {
    const command: Command | null = factory.createCommand(CommandTypes.RESTORE_ENV)
    command !== null && CommandInvoker.executeCommands(command)
  })

program
  .command('generate [filename]')
  .description(`${chalk.yellow('GENERATE')} the .env-example file based on ypur env file.`)
  .alias('g')
  .action(async (filename) => {
    const command: Command | null = factory.createCommand(CommandTypes.GENERATE_EXAMPLE_ENV, filename)
    command !== null && CommandInvoker.executeCommands(command)
  })

program.parse(process.argv)
