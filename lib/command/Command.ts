import { getBaseFolder } from '../handler/fileHandler'
import inquirer from 'inquirer'

export abstract class Command {
  protected readonly baseFolder: string

  constructor () {
    this.baseFolder = getBaseFolder()
  }

  abstract beforeExecute (): Promise<any>
  abstract execute (): Promise<void>
  async askForConfirmation (): Promise<boolean> {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmation',
        message: 'Are you sure you want to perform this operation?',
        default: false
      }
    ])

    return answer.confirmation
  }
}
