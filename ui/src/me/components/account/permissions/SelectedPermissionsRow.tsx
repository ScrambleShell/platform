// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import {
  IndexList,
  IconFont,
  Alignment,
  ComponentSize,
  ButtonShape,
  Button,
  ComponentColor,
  Radio,
} from 'src/clockface'

// Types
import {Permission} from 'src/api'
const {ActionEnum} = Permission

interface Props {
  permission: Permission
  onRemovePermission: (permission: Permission) => void
  onUpdatePermission: (permission: Permission) => void
}

export default class SelectedPermissionsRow extends PureComponent<Props> {
  public render() {
    return (
      <IndexList.Row>
        <IndexList.Cell alignment={Alignment.Left}>
          {this.toggleCell}
        </IndexList.Cell>
        <IndexList.Cell>{this.resourceName}</IndexList.Cell>
        <IndexList.Cell>{this.resourceType}</IndexList.Cell>
        <IndexList.Cell alignment={Alignment.Right} revealOnHover={true}>
          {this.actionCell}
        </IndexList.Cell>
      </IndexList.Row>
    )
  }

  private get resourceName(): string {
    const {permission} = this.props

    if (permission.id) {
      return permission.name
    }

    return `All ${_.upperFirst(permission.resource)}`
  }

  private get resourceType(): string {
    const {permission} = this.props

    return _.upperFirst(permission.resource).substring(
      0,
      permission.resource.length - 1
    )
  }

  private get toggleCell(): JSX.Element {
    const {permission} = this.props

    return (
      <Radio>
        <Radio.Button
          id={`permission-toggle--${permission.id}`}
          active={permission.action === ActionEnum.Read}
          value={ActionEnum.Read}
          onClick={this.handleToggleClick}
          titleText={`Set permission to ${ActionEnum.Read} ${
            this.resourceName
          }`}
        >
          {ActionEnum.Read}
        </Radio.Button>
        <Radio.Button
          id={`permission-toggle--${permission.id}`}
          active={permission.action === ActionEnum.Write}
          value={ActionEnum.Write}
          onClick={this.handleToggleClick}
          titleText={`Set permission to ${ActionEnum.Write} ${
            this.resourceName
          }`}
        >
          {ActionEnum.Write}
        </Radio.Button>
      </Radio>
    )
  }

  private get actionCell(): JSX.Element {
    return (
      <Button
        color={ComponentColor.Danger}
        size={ComponentSize.ExtraSmall}
        shape={ButtonShape.Square}
        icon={IconFont.Remove}
        onClick={this.handleRemove}
      />
    )
  }

  private handleRemove = (): void => {
    const {permission, onRemovePermission} = this.props
    onRemovePermission(permission)
  }

  private handleToggleClick = (action: Permission.ActionEnum): void => {
    const {permission, onUpdatePermission} = this.props

    const updatedPermission = {...permission, action}

    onUpdatePermission(updatedPermission)
  }
}
