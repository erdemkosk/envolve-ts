import { Command } from '../Command'
import { getValuesInEnv } from '../../envHandler'
import { getEnvFilesRecursively } from '../../fileHandler'
import Table from 'cli-table3'
import chalk from 'chalk'
import inquirer from 'inquirer'

export class LsCommand extends Command {
  async beforeExecute (): Promise<any> {
    const files = await getEnvFilesRecursively({ directory: this.baseFolder })

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

    return targetPath
  }

  async execute (): Promise<void> {
    const targetPath: string = await this.beforeExecute()

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
  }
}
