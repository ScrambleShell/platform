// Libraries
import React, {PureComponent} from 'react'

// Components
import {
  IndexList,
  EmptyState,
  ComponentSize,
  OverlayTechnology,
} from 'src/clockface'
import TokenRow from 'src/me/components/account/TokenRow'
import ViewTokenOverlay from 'src/me/components/account/ViewTokenOverlay'

// Actions
import {notify} from 'src/shared/actions/notifications'

// Types
import {Authorization} from 'src/api'
import {OverlayState} from 'src/types/v2'

// Constants
import {
  TokenDeletionSuccess,
  TokenDeletionError,
} from 'src/shared/copy/notifications'

interface Props {
  auths: Authorization[]
  onNotify: typeof notify
  searchTerm: string
}

interface State {
  overlayVisibility: OverlayState
  overlayAuth: Authorization
  auths: Authorization[]
}

export default class TokenList extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      overlayVisibility: OverlayState.Closed,
      overlayAuth: null,
      auths: this.props.auths,
    }
  }

  public render() {
    const {onNotify} = this.props
    const {auths, overlayAuth} = this.state

    return (
      <>
        <IndexList>
          <IndexList.Header>
            <IndexList.HeaderCell columnName="Description" />
            <IndexList.HeaderCell columnName="Status" />
            <IndexList.HeaderCell columnName="Organization" />
            <IndexList.HeaderCell columnName="" />
          </IndexList.Header>
          <IndexList.Body emptyState={this.emptyState} columnCount={2}>
            {auths.map(a => {
              return (
                <TokenRow
                  key={a.id}
                  auth={a}
                  onNotify={onNotify}
                  onDelete={this.handleDelete}
                  onShowOverlay={this.handleShowOverlay}
                />
              )
            })}
          </IndexList.Body>
        </IndexList>
        <OverlayTechnology visible={this.overlayVisibility}>
          <ViewTokenOverlay
            auth={overlayAuth}
            onDismiss={this.handleDismissOverlay}
          />
        </OverlayTechnology>
      </>
    )
  }

  private get emptyState(): JSX.Element {
    const {searchTerm} = this.props
    let emptyStateText = 'Could not find any tokens'

    if (searchTerm) {
      emptyStateText = 'Looks like no tokens match your search term'
    }
    return (
      <EmptyState size={ComponentSize.Large}>
        <EmptyState.Text text={emptyStateText} />
      </EmptyState>
    )
  }

  private get overlayVisibility(): boolean {
    const {overlayVisibility} = this.state

    return overlayVisibility === OverlayState.Open
  }

  private handleShowOverlay = (authID: string): void => {
    const {auths} = this.props
    const overlayAuth = auths.find(a => a.id === authID)

    this.setState({overlayAuth, overlayVisibility: OverlayState.Open})
  }

  private handleDismissOverlay = (): void => {
    this.setState({overlayVisibility: OverlayState.Closed})
  }

  private handleDelete = async (authID: string) => {
    const {onNotify} = this.props
    const {auths} = this.state

    try {
      this.setState({
        auths: auths.filter(auth => {
          return auth.id !== authID
        }),
      })

      // await deleteAuthorization(authID)

      onNotify(TokenDeletionSuccess)
    } catch (error) {
      this.setState({auths})
      onNotify(TokenDeletionError)
    }
  }
}
