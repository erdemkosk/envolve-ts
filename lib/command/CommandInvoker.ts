import type Command from './Command'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class CommandInvoker {
  static executeCommands (command: Command): any {
    return command.execute()
  }
}
