import Command from '../command'
import { generateEnvExampleFile } from '../../handler/envHandler'
import chalk from 'chalk'
import { consola } from 'consola'

export default class RestoreCommand extends Command {
  protected async beforeExecute (): Promise<any> {
    const isConfirmed = await this.askForConfirmation()

    if (!isConfirmed) {
      console.log(`Operation is ${chalk.red('cancelled!')}`)
    }
  }

  protected async onExecute (beforeExecuteReturnValue: any): Promise<void> {
    const isSuccess = await generateEnvExampleFile(this.params[0][0])

    isSuccess
      ? consola.success('Env example was creating successfully. You are ready to go!')
      : consola.error('There was a problem generate .env-example file.')
  }
}
