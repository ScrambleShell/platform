// Libraries
import _ from 'lodash'

import {orgsAPI, bucketsAPI, dashboardsAPI, taskAPI} from 'src/utils/api'

// Types
import {Bucket, Dashboard, Task, Organization, User} from 'src/api'
import {LabelType} from 'src/clockface'

// CRUD APIs for Organizations and Organization resources
// i.e. Organization Members, Buckets, Dashboards etc

export const getOrganizations = async (): Promise<Organization[]> => {
  const {data} = await orgsAPI.orgsGet()

  return data.orgs
}

export const createOrg = async (org: Organization): Promise<Organization> => {
  try {
    const {data} = await orgsAPI.orgsPost(org)

    return data
  } catch (error) {
    console.error('Could not get members for org', error)
    throw error
  }
}

export const deleteOrg = async (org: Organization): Promise<void> => {
  try {
    await orgsAPI.orgsOrgIDDelete(org.id)
  } catch (error) {
    console.error('Could not delete org', error)
    throw error
  }
}

export const updateOrg = async (org: Organization): Promise<Organization> => {
  try {
    const {data} = await orgsAPI.orgsOrgIDPatch(org.id, org)

    return data
  } catch (error) {
    console.error('Could not get members for org', error)
    throw error
  }
}

// Members
export const getMembers = async (org: Organization): Promise<User[]> => {
  try {
    const {data} = await orgsAPI.orgsOrgIDMembersGet(org.id)

    return data.users
  } catch (error) {
    console.error('Could not get members for org', error)
    throw error
  }
}

// Buckets
export const getBuckets = async (org: Organization): Promise<Bucket[]> => {
  try {
    const {data} = await bucketsAPI.bucketsGet(org.name)

    return data.buckets
  } catch (error) {
    console.error('Could not get buckets for org', error)
    throw error
  }
}

export const createBucket = async (
  org: Organization,
  bucket: Bucket
): Promise<Bucket> => {
  try {
    const {data} = await bucketsAPI.bucketsPost(org.name, bucket)

    return data
  } catch (error) {
    console.error('Could not get buckets for org', error)
    throw error
  }
}

export const updateBucket = async (bucket: Bucket): Promise<Bucket> => {
  try {
    const {data} = await bucketsAPI.bucketsBucketIDPatch(bucket.id, bucket)

    return data
  } catch (error) {
    console.error('Could not get members for org', error)
    throw error
  }
}

export const getDashboards = async (
  org?: Organization
): Promise<Dashboard[]> => {
  try {
    let result
    if (org) {
      const {data} = await dashboardsAPI.dashboardsGet(org.name)
      result = data.dashboards
    } else {
      const {data} = await dashboardsAPI.dashboardsGet(null)
      result = data.dashboards
    }

    return result
  } catch (error) {
    console.error('Could not get buckets for org', error)
    throw error
  }
}

export const getTasks = async (org: Organization): Promise<Task[]> => {
  try {
    const {data} = await taskAPI.tasksGet(null, null, org.name)

    return data.tasks
  } catch (error) {
    console.error('Could not get tasks for org', error)
    throw error
  }
}

export const getLabels = async (org: Organization): Promise<LabelType[]> => {
  // Use try catch when accessing the actual API
  // TODO: Delete this silly mocks
  const mockLabels: LabelType[] = [
    {
      id: '0',
      name: 'Swogglez',
      description: 'I am an example Label',
      colorHex: '#ff0054',
    },
    {
      id: '1',
      name: 'Top Secret',
      description: 'Only admins can modify these resources',
      colorHex: '#4a52f4',
    },
    {
      id: '2',
      name: 'Pineapples',
      description: 'Pineapples are in my head',
      colorHex: '#f4c24a',
    },
    {
      id: '3',
      name: 'SWAT',
      description: 'Boots and cats and boots and cats',
      colorHex: '#d6ff9c',
    },
    {
      id: '4',
      name: 'the GOAT',
      description: 'Gatsby obviously ate turnips',
      colorHex: '#17d9f0',
    },
    {
      id: '5',
      name: 'My Spoon is Too Big',
      description: 'My Spooooooooon is Too Big',
      colorHex: '#27c27e',
    },
  ]

  return mockLabels
}
