import { Command } from '../Command'
import { syncEnvFile } from '../../handler/envHandler'
import chalk from 'chalk'

export class SyncCommand extends Command {
  protected async beforeExecute (): Promise<any> {
    return await syncEnvFile()
  }

  protected async onExecute (beforeExecuteReturnValue: any): Promise<void> {
    const isSuccess: boolean = beforeExecuteReturnValue

    ;(isSuccess)
      ? console.log(`Synchronization was ${chalk.blue('successful')}. You are ready to go!`)
      : console.log(`There was a ${chalk.red('problem')} synchronizing . Make sure you are on the correct file path and that your file contains an .env file`)
  }
}
