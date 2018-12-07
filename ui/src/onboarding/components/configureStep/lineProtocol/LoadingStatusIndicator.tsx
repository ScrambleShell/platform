// Libraries
import React, {PureComponent} from 'react'
import {
  SparkleSpinner,
  Button,
  ComponentColor,
  ComponentSize,
} from 'src/clockface'

// Types
import {RemoteDataState} from 'src/types'

interface Props {
  status: RemoteDataState
}

class LoadingStatusIndicator extends PureComponent<Props> {
  public render() {
    const {status} = this.props
    return (
      <>
        <div className={'wizard-step--top-container'}>
          <div className={'wizard-step--sparkle-container'}>
            <SparkleSpinner loading={status} />
          </div>
          {this.retryButton}
        </div>
        <div className={'wizard-step--footer'}>
          <div className={`wizard-step--text-state ${this.footerClass}`}>
            {this.footerText}
          </div>
        </div>
        <br />
      </>
    )
  }

  private get retryButton(): JSX.Element {
    const {status} = this.props
    if (status === RemoteDataState.Error) {
      return (
        <Button
          text={'Try Again'}
          color={ComponentColor.Primary}
          size={ComponentSize.Small}
          customClass={'wizard-step--retry-button'}
        />
      )
    } else {
      return null
    }
  }

  private get footerClass(): string {
    switch (this.props.status) {
      case RemoteDataState.Loading:
        return 'loading'
      case RemoteDataState.Done:
        return 'success'
      case RemoteDataState.Error:
        return 'error'
    }
  }

  private get footerText(): string {
    switch (this.props.status) {
      case RemoteDataState.Loading:
        return 'Loading...'
      case RemoteDataState.Done:
        return 'Data Written Successfully!'
      case RemoteDataState.Error:
        return 'Unable to Write Data'
    }
  }
}

export default LoadingStatusIndicator
