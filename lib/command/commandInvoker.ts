import type Command from './command'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class CommandInvoker {
  static executeCommands (command: Command): any {
    return command.execute()
  }
}
