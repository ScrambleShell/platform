// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import {IndexList, Alignment, EmptyState, ComponentSize} from 'src/clockface'
import SelectedPermissionsRow from 'src/me/components/account/permissions/SelectedPermissionsRow'
import FancyScrollbar from 'src/shared/components/fancy_scrollbar/FancyScrollbar'

// Types
import {Permission} from 'src/api'

interface Props {
  permissions: Permission[]
  onRemovePermission: (permission: Permission) => void
  onUpdatePermission: (permission: Permission) => void
}

export default class SelectedPermissions extends PureComponent<Props> {
  public render() {
    const {permissions, onRemovePermission, onUpdatePermission} = this.props

    return (
      <FancyScrollbar autoHeight={true} maxHeight={300}>
        <IndexList size={ComponentSize.Small}>
          <IndexList.Header>
            <IndexList.HeaderCell
              columnName="Action"
              width="24%"
              alignment={Alignment.Left}
            />
            <IndexList.HeaderCell
              columnName="Name"
              width="24%"
              alignment={Alignment.Left}
            />
            <IndexList.HeaderCell columnName="Resource" width="42%" />
            <IndexList.HeaderCell columnName="" width="10%" />
          </IndexList.Header>
          <IndexList.Body emptyState={this.emptyList} columnCount={4}>
            {permissions.map(p => (
              <SelectedPermissionsRow
                key={p.id || `selected-permission--all-${p.resource}s`}
                permission={p}
                onRemovePermission={onRemovePermission}
                onUpdatePermission={onUpdatePermission}
              />
            ))}
          </IndexList.Body>
        </IndexList>
      </FancyScrollbar>
    )
  }

  private get emptyList(): JSX.Element {
    return (
      <EmptyState size={ComponentSize.Medium}>
        <EmptyState.Text text="Add some permissions using the list above" />
      </EmptyState>
    )
  }
}
