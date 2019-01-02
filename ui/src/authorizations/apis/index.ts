import {Authorization} from 'src/api'
import {authorizationsAPI} from 'src/utils/api'
import {AxiosResponse} from 'axios'
import {authorization} from './__mocks__/data'

export const getAuthorizations = async (): Promise<Authorization[]> => {
  // const {data} = await authorizationsAPI.authorizationsGet()
  return [authorization]
}

export const deleteAuthorization = async (
  authID: string
): Promise<AxiosResponse> => {
  const response = await authorizationsAPI.authorizationsAuthIDDelete(authID)
  return response
}
