import { getBaseFolder } from '../handler/fileHandler'
import inquirer from 'inquirer'

export abstract class Command {
  protected readonly baseFolder: string

  constructor () {
    this.baseFolder = getBaseFolder()
  }

  async execute (): Promise<void> {
    try {
      const beforeExecuteReturnValue: any = await this.beforeExecute()
      await this.onExecute(beforeExecuteReturnValue)
    } catch (error) {
    }
  }

  protected abstract beforeExecute (): Promise<any>

  protected abstract onExecute (value: any): Promise<void>

  protected async askForConfirmation (): Promise<boolean> {
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
