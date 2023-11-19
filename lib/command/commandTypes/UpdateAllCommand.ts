import { Command } from '../Command'
import { updateAllEnvFile, promptForEnvVariable } from '../../handler/envHandler'
import chalk from 'chalk'
import inquirer from 'inquirer'

export class UpdateAllCommand extends Command {
  async beforeExecute (): Promise<any> {
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

    const isConfirmed = await this.askForConfirmation()

    if (!isConfirmed) {
      console.log(`Operation is ${chalk.red('cancelled!')}`)
      return
    }

    return await updateAllEnvFile({ envValue, newValue })
  }

  async execute (): Promise<void> {
    const effectedServices: [] = await this.beforeExecute()

    effectedServices.forEach((service) => {
      console.log(`Environment variables updated in "${chalk.blue(service)}"`)
    })
  }
}
