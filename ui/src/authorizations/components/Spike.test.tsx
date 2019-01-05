import React from 'react'
import {render, waitForElement} from 'react-testing-library'

import Spike from 'src/authorizations/components/Spike'

jest.mock('src/authorizations/apis')

describe('Spike', () => {
  it('should show a list', async () => {
    const {getByTestId} = render(<Spike spike={true} />)

    await waitForElement(() => getByTestId('spike-list--items'))

    const items = getByTestId('spike-list--items').children

    expect(items).toHaveLength(2)
  })

  it('should not spike if I tell it not to', async () => {
    const {getByTestId} = render(<Spike spike={false} />)

    await waitForElement(() => getByTestId('spike-list--items'))

    const items = getByTestId('spike-list--items').children

    expect(items).toHaveLength(0)
  })
})
