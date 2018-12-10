import React from 'react'
import {render, waitForElement, cleanup} from 'react-testing-library'

import {TimeMachineQueryBuilder} from 'src/shared/components/TimeMachineQueryBuilder'

import {SourceType} from 'src/types/v2'

jest.mock('src/shared/apis/v2/queryBuilder')

afterEach(cleanup)

describe('TimeMachineQueryBuilder', () => {
  test('should show a buckets list', async () => {
    const {getByTestId} = render(
      <TimeMachineQueryBuilder
        queryURL=""
        sourceType={SourceType.V2}
        onBuildQuery={jest.fn()}
      />
    )

    await waitForElement(() => {
      getByTestId('builder-card--items')
    })

    expect(getByTestId('builder-card--items').children).toHaveLength(3)
  })
})
