import React, {PureComponent} from 'react'
import {getAuthorizations} from 'src/authorizations/apis'

import {RemoteDataState} from 'src/types'
import {Authorization} from 'src/api'

interface State {
  authorizations: Authorization[]
  loading: RemoteDataState
}

interface Props {
  spike: boolean
}

// Spike is an example component for async unit testing
// using react-testing-library
export default class Spike extends PureComponent<Props, State> {
  public state = {
    authorizations: [],
    loading: RemoteDataState.NotStarted,
  }

  public async componentDidMount() {
    if (!this.props.spike) {
      this.setState({loading: RemoteDataState.Done})
      return
    }

    const authorizations = await getAuthorizations()
    this.setState({authorizations, loading: RemoteDataState.Done})
  }

  public render() {
    const {loading, authorizations} = this.state

    if (loading !== RemoteDataState.Done) {
      return <div data-testid="spike-spinner">im a spinner</div>
    }

    return (
      <div data-testid="spike-list--items">
        {authorizations.map(a => {
          return <div key={a.id}>{a.description}</div>
        })}
      </div>
    )
  }
}
