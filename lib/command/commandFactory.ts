import { CommandTypes } from '../const'
import type Command from './command'
import DiffCommand from './commandTypes/diffCommand'
import LsCommand from './commandTypes/lsCommand'
import RestoreCommand from './commandTypes/restoreCommand'
import RevertCommand from './commandTypes/revertCommand'
import SyncCommand from './commandTypes/syncCommand'
import UpdateAllCommand from './commandTypes/updateAllCommand'
import UpdateCommand from './commandTypes/updateCommand'
import GenerateCommand from './commandTypes/generateCommand'

export default class CommandFactory {
  createCommand (commandType: number, ...params: any []): Command | null {
    switch (commandType) {
      case CommandTypes.LS:
        return new LsCommand(params)
      case CommandTypes.SYNC:
        return new SyncCommand(params)
      case CommandTypes.DIFF:
        return new DiffCommand(params)
      case CommandTypes.UPDATE:
        return new UpdateCommand(params)
      case CommandTypes.UPDATE_ALL:
        return new UpdateAllCommand(params)
      case CommandTypes.REVERT:
        return new RevertCommand(params)
      case CommandTypes.RESTORE_ENV:
        return new RestoreCommand(params)
      case CommandTypes.GENERATE_EXAMPLE_ENV:
        return new GenerateCommand(params)

      default:
        return null
    }
  }
}
