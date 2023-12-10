import Command from '../command'
import { updateEnvFile, getUniqueEnvNames } from '../../handler/envHandler'
import { getEnvFilesRecursively } from '../../handler/fileHandler'
import { getEnvVersions } from '../../handler/historyHandler'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { format } from 'date-fns'
import { consola } from 'consola'

export default class RevertCommand extends Command {
  protected async beforeExecute (): Promise<any> {
    const files = await getEnvFilesRecursively({ directory: this.baseFolder })

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
      choices: versions.map((version: { timestamp: any, changes: Array<{ oldValue: any, value: any }> }) => {
        const formattedTimestamp = format(new Date(version.timestamp), 'yyyy-MM-dd HH:mm:ss')
        return {
          name: `Version ${formattedTimestamp} - ${version.changes[0].value}`,
          value: version
        }
      })
    })

    return { targetPath, envValue, newValue: version.changes[0].oldValue }
  }

  protected async onExecute (beforeExecuteReturnValue: any): Promise<void> {
    const { targetPath, envValue, newValue } = beforeExecuteReturnValue

    await updateEnvFile({ file: targetPath, envValue, newValue })
    consola.start(`Environment variables restored in "${chalk.blue(targetPath)}"`)
  }
}
