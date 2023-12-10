import { Command } from '../Command'
import { getUniqueEnvNames, updateEnvFile } from '../../handler/envHandler'
import { getEnvFilesRecursively } from '../../handler/fileHandler'
import chalk from 'chalk'
import inquirer from 'inquirer'

export class UpdateCommand extends Command {
  protected async beforeExecute (): Promise<any> {
    const files = await getEnvFilesRecursively({ directory: this.baseFolder })

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

    return { targetPath, envValue, newValue }
  }

  protected async onExecute (beforeExecuteReturnValue: any): Promise<void> {
    const { targetPath, envValue, newValue } = beforeExecuteReturnValue
    await updateEnvFile({ file: targetPath, envValue, newValue })

    console.log(`Environment variables updated in "${chalk.blue(targetPath)}"`)
  }
}
