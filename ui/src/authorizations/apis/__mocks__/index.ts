import {authorization} from './data'

// Types
import {Authorization} from 'src/api'

export const getAuthorizations = (): Promise<Authorization[]> => {
  return Promise.resolve([authorization, {...authorization, id: '1'}])
}
