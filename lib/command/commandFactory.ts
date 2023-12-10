import { CommandTypes } from '../const'
import type Command from './Command'
import CompareCommand from './commandTypes/CompareCommand'
import LsCommand from './commandTypes/LsCommand'
import RestoreCommand from './commandTypes/RestoreCommand'
import RevertCommand from './commandTypes/RevertCommand'
import SyncCommand from './commandTypes/SyncCommand'
import UpdateAllCommand from './commandTypes/UpdateAllCommand'
import UpdateCommand from './commandTypes/UpdateCommand'

export default class CommandFactory {
  createCommand (commandType: number): Command | null {
    switch (commandType) {
      case CommandTypes.LS:
        return new LsCommand()
      case CommandTypes.SYNC:
        return new SyncCommand()
      case CommandTypes.COMPARE:
        return new CompareCommand()
      case CommandTypes.UPDATE:
        return new UpdateCommand()
      case CommandTypes.UPDATE_ALL:
        return new UpdateAllCommand()
      case CommandTypes.REVERT:
        return new RevertCommand()
      case CommandTypes.RESTORE_ENV:
        return new RestoreCommand()

      default:
        return null
    }
  }
}
