import { Command } from '../Command'
import { restoreEnvFile } from '../../handler/envHandler'
import chalk from 'chalk'

export class RestoreCommand extends Command {
  async beforeExecute (): Promise<any> {
    const isConfirmed = await this.askForConfirmation()

    if (!isConfirmed) {
      console.log(`Operation is ${chalk.red('cancelled!')}`)
    }
  }

  async execute (): Promise<void> {
    await this.beforeExecute()

    const isSuccess = await restoreEnvFile()

    isSuccess
      ? console.log('Reversion was successful. You are ready to go!')
      : console.log('There was a problem reverting .env file.')
  }
}
