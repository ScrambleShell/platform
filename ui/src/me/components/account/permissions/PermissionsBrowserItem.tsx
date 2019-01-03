// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Types
import {Bucket} from 'src/types/v2'
import {Permission} from 'src/api'
const {ResourceEnum, ActionEnum} = Permission

// Styles
import 'src/me/components/account/permissions/PermissionsBrowser.scss'

interface Props {
  bucket?: Bucket
  onClick: (Permission) => void
}

export default class PermissionsBrowser extends PureComponent<Props> {
  public render() {
    return (
      <div
        className="permissions-browser--list-item"
        onClick={this.handleClick}
      >
        {this.label}
        <span>Click to add permission</span>
      </div>
    )
  }

  private get label(): string {
    const {bucket} = this.props

    if (bucket && bucket.id) {
      return bucket.name
    }

    return `All ${_.upperFirst(ResourceEnum.Buckets)}`
  }

  private handleClick = (): void => {
    const {onClick, bucket} = this.props

    const permission = {
      action: ActionEnum.Read,
      resource: ResourceEnum.Buckets,
    }

    if (bucket) {
      return onClick({
        ...permission,
        id: bucket.id,
        name: bucket.name,
      })
    }

    onClick(permission)
  }
}
