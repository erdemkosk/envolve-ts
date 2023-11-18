import { Command } from '../command'
import { compareEnvFiles } from '../../handler/envHandler'
import { getEnvFilesRecursively } from '../../handler/fileHandler'
import Table from 'cli-table3'
import chalk from 'chalk'
import inquirer from 'inquirer'

export class CompareCommand extends Command {
  async beforeExecute (): Promise<any> {
    const files: string [] = await getEnvFilesRecursively({ directory: this.baseFolder })

    if (files.length < 2) {
      throw new Error(`You must have a minimum of ${chalk.blue('2')} services registered to compare.`)
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

    return { source, destination }
  }

  async execute (): Promise<void> {
    try {
      const { source, destination } = await this.beforeExecute()

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
    } catch (error) {
      console.log(error.message)
    }
  }
}
