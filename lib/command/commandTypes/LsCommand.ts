import { Command } from '../Command'
import { getValuesInEnv } from '../../handler/envHandler'
import { getEnvFilesRecursively } from '../../handler/fileHandler'
import Table from 'cli-table3'
import chalk from 'chalk'
import inquirer from 'inquirer'

export class LsCommand extends Command {
  protected async beforeExecute (): Promise<any> {
    const files = await getEnvFilesRecursively({ directory: this.baseFolder })

    if (files.length === 0) {
      throw new Error(`You have not registered any service yet. Go to the file path of the request with your ${chalk.blue('.env')} file in it and run the ${chalk.blue('sync')} command.`)
    }

    const { targetPath } = await inquirer.prompt({
      type: 'list',
      name: 'targetPath',
      message: 'Select an .env file to show:',
      choices: files
    })

    return targetPath
  }

  protected async onExecute (beforeExecuteReturnValue: any): Promise<void> {
    const targetPath: string = beforeExecuteReturnValue

    const { data } = await getValuesInEnv({ targetPath })

    const terminalWidth = process.stdout.columns

    const table = new Table({
      head: ['ENV', 'VALUE'],
      colWidths: [Math.floor(terminalWidth / 2 - 5), Math.floor(terminalWidth / 2 - 5)],
      wrapOnWordBoundary: false,
      wordWrap: true
    })

    data.forEach(row => {
      table.push(row)
    })

    console.log(table.toString())
  }
}
