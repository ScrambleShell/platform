// Types
import {OnboardingStepProps} from 'src/onboarding/containers/OnboardingWizard'
import {links} from 'mocks/dummyData'
import {ConfigurationState} from 'src/types/v2/dataLoaders'
import {TelegrafPluginInputCpu} from 'src/api'

export const defaultOnboardingStepProps: OnboardingStepProps = {
  links,
  currentStepIndex: 0,
  onSetCurrentStepIndex: jest.fn(),
  onIncrementCurrentStepIndex: jest.fn(),
  onDecrementCurrentStepIndex: jest.fn(),
  handleSetStepStatus: jest.fn(),
  stepStatuses: [],
  stepTitles: [],
  setupParams: {username: '', password: '', org: '', bucket: ''},
  handleSetSetupParams: jest.fn(),
  notify: jest.fn(),
  onCompleteSetup: jest.fn(),
  onExit: jest.fn(),
}

export const token =
  'm4aUjEIhM758JzJgRmI6f3KNOBw4ZO77gdwERucF0bj4QOLHViD981UWzjaxW9AbyA5THOMBp2SVZqzbui2Ehw=='

export const telegrafConfigID = '030358c935b18000'

export const cpuPlugin = {
  name: 'cpu',
  type: 'input',
  comment: 'this is a test',
  config: {},
}

export const telegrafPlugin = {
  name: TelegrafPluginInputCpu.NameEnum.Cpu,
  configured: ConfigurationState.Unconfigured,
  active: true,
}

export const influxDB2Plugin = {
  name: 'influxdb_v2',
  type: 'output',
  comment: 'write to influxdb v2',
  config: {
    urls: ['http://127.0.0.1:9999'],
    token,
    organization: 'default',
    bucket: 'defbuck',
  },
}

export const telegrafConfig = {
  id: telegrafConfigID,
  name: 'in n out',
  created: '2018-11-28T18:56:48.854337-08:00',
  lastModified: '2018-11-28T18:56:48.854337-08:00',
  lastModifiedBy: '030358b695318000',
  agent: {collectionInterval: 15},
  plugins: [cpuPlugin, influxDB2Plugin],
}

export const telegrafConfigsResponse = {
  data: {
    configurations: [telegrafConfig],
  },
  status: 200,
  statusText: 'OK',
  headers: {
    date: 'Thu, 29 Nov 2018 18:10:21 GMT',
    'content-length': '570',
    'content-type': 'application/json; charset=utf-8',
  },
  config: {
    transformRequest: {},
    transformResponse: {},
    timeout: 0,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    maxContentLength: -1,
    headers: {Accept: 'application/json, text/plain, */*'},
    method: 'get',
    url: '/api/v2/telegrafs?org=',
  },
  request: {},
}

export const authResponse = {
  data: {
    links: {self: '/api/v2/authorizations'},
    auths: [
      {
        links: {
          self: '/api/v2/authorizations/030358b6aa718000',
          user: '/api/v2/users/030358b695318000',
        },
        id: '030358b6aa718000',
        token,
        status: 'active',
        user: 'iris',
        userID: '030358b695318000',
        permissions: [
          {action: 'create', resource: 'user'},
          {action: 'delete', resource: 'user'},
          {action: 'write', resource: 'org'},
          {action: 'write', resource: 'bucket/030358b6aa318000'},
        ],
      },
    ],
  },
  status: 200,
  statusText: 'OK',
  headers: {
    date: 'Thu, 29 Nov 2018 18:10:21 GMT',
    'content-length': '522',
    'content-type': 'application/json; charset=utf-8',
  },
  config: {
    transformRequest: {},
    transformResponse: {},
    timeout: 0,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    maxContentLength: -1,
    headers: {Accept: 'application/json, text/plain, */*'},
    method: 'get',
    url: '/api/v2/authorizations?user=',
  },
  request: {},
}
