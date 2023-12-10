import { Command } from '../Command'
import { restoreEnvFile } from '../../handler/envHandler'
import chalk from 'chalk'

export class RestoreCommand extends Command {
  protected async beforeExecute (): Promise<any> {
    const isConfirmed = await this.askForConfirmation()

    if (!isConfirmed) {
      console.log(`Operation is ${chalk.red('cancelled!')}`)
    }
  }

  protected async onExecute (beforeExecuteReturnValue: any): Promise<void> {
    const isSuccess = await restoreEnvFile()

    isSuccess
      ? console.log('Reversion was successful. You are ready to go!')
      : console.log('There was a problem reverting .env file.')
  }
}
