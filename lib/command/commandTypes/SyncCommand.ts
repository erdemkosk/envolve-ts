import { Command } from '../Command'
import { syncEnvFile } from '../../handler/envHandler'
import chalk from 'chalk'
import { consola } from 'consola'

export class SyncCommand extends Command {
  protected async beforeExecute (): Promise<any> {
    return await syncEnvFile()
  }

  protected async onExecute (beforeExecuteReturnValue: any): Promise<void> {
    const isSuccess: boolean = beforeExecuteReturnValue

    ;(isSuccess)
      ? consola.success(`Synchronization was ${chalk.blue('successful')}. You are ready to go!`)
      : consola.error(`There was a ${chalk.red('problem')} synchronizing . Make sure you are on the correct file path and that your file contains an .env file`)
  }
}
