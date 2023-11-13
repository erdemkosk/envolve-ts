import { type IEnvChange } from './env-change'

export interface IEnvVersion {
  timestamp: string
  changes: IEnvChange[]
}
