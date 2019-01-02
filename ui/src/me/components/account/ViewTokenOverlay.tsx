// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import {
  IndexList,
  OverlayContainer,
  OverlayHeading,
  OverlayBody,
  Alignment,
  EmptyState,
  ComponentSize,
} from 'src/clockface'
import ViewTokenOverlayRow from 'src/me/components/account/ViewTokenOverlayRow'

// Types
import {Authorization} from 'src/api'

interface Props {
  auth: Authorization
  onDismiss: () => void
}

export default class TokenRow extends PureComponent<Props> {
  public render() {
    const {auth, onDismiss} = this.props

    if (!auth) {
      return
    }

    return (
      <OverlayContainer maxWidth={460}>
        <OverlayHeading title={auth.description} onDismiss={onDismiss} />
        <OverlayBody>
          <IndexList size={ComponentSize.Small}>
            <IndexList.Header>
              <IndexList.HeaderCell
                columnName="Read"
                width="12%"
                alignment={Alignment.Center}
              />
              <IndexList.HeaderCell
                columnName="Write"
                width="12%"
                alignment={Alignment.Center}
              />
              <IndexList.HeaderCell
                columnName="Delete"
                width="12%"
                alignment={Alignment.Center}
              />
              <IndexList.HeaderCell columnName="Resource" width="64%" />
            </IndexList.Header>
            <IndexList.Body emptyState={this.emptyList} columnCount={3}>
              {auth.permissions.map((p, i) => (
                <ViewTokenOverlayRow key={i} permission={p} />
              ))}
            </IndexList.Body>
          </IndexList>
        </OverlayBody>
      </OverlayContainer>
    )
  }

  private get emptyList(): JSX.Element {
    return (
      <EmptyState>
        <EmptyState.Text text="This token has no associated permissions" />
      </EmptyState>
    )
  }
}
