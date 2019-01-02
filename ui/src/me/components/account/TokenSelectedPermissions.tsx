// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import {
  IndexList,
  IconFont,
  Alignment,
  Greys,
  EmptyState,
  ComponentSize,
  Form,
  ButtonShape,
  Button,
} from 'src/clockface'

// Types
import {Permission} from 'src/api'
const {ActionEnum} = Permission

interface Props {
  permissions: Permission[]
}

export default class TokenSelectedPermissions extends PureComponent<Props> {
  public render() {
    return (
      <Form.Element label="Selected Permissions">
        <Form.Box>
          <IndexList size={ComponentSize.Small}>
            <IndexList.Header>
              <IndexList.HeaderCell columnName="Resource" width="56%" />
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
              <IndexList.HeaderCell columnName="" width="8%" />
            </IndexList.Header>
            <IndexList.Body emptyState={this.emptyList} columnCount={3}>
              {this.rows}
            </IndexList.Body>
          </IndexList>
        </Form.Box>
      </Form.Element>
    )
  }

  private get rows(): JSX.Element[] {
    const {permissions} = this.props

    return permissions.map(p => (
      <IndexList.Row>
        {this.readCell(p)}
        {this.writeCell(p)}
        {this.resourceCell(p)}
        {this.actionCell(p)}
      </IndexList.Row>
    ))
  }

  private resourceCell = (permission: Permission): JSX.Element => {
    let resource = `All ${_.upperFirst(permission.resource)}`

    if (permission.id) {
      resource = permission.name
    }

    return <IndexList.Cell>{resource}</IndexList.Cell>
  }

  private readCell = (permission: Permission): JSX.Element => {
    if (
      permission.action === ActionEnum.Read ||
      permission.action === ActionEnum.Write
    ) {
      return (
        <IndexList.Cell alignment={Alignment.Center}>
          <span
            className={`icon ${IconFont.Checkmark}`}
            style={{color: '#4ED8A0'}}
          />
        </IndexList.Cell>
      )
    }
  }

  private writeCell = (permission: Permission): JSX.Element => {
    if (permission.action === ActionEnum.Write) {
      return (
        <IndexList.Cell alignment={Alignment.Center}>
          <span
            className={`icon ${IconFont.Checkmark}`}
            style={{color: '#4ED8A0'}}
          />
        </IndexList.Cell>
      )
    }

    return (
      <IndexList.Cell alignment={Alignment.Center}>
        <span
          className={`icon ${IconFont.Remove}`}
          style={{color: `${Greys.Mountain}`}}
        />
      </IndexList.Cell>
    )
  }

  private actionCell = (permission: Permission): JSX.Element => {
    return (
      <IndexList.Cell alignment={Alignment.Center} revealOnHover={true}>
        <Button shape={ButtonShape.Square} icon={IconFont.Remove} />
      </IndexList.Cell>
    )
  }

  private get emptyList(): JSX.Element {
    return (
      <EmptyState size={ComponentSize.Medium}>
        <EmptyState.Text text="Add some permissions from the list below" />
      </EmptyState>
    )
  }
}
