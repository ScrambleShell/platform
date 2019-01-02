// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import {IndexList, IconFont, Alignment, Greys} from 'src/clockface'

// Types
import {Permission} from 'src/api'
const {ActionEnum} = Permission

interface Props {
  permission: Permission
}

export default class ViewTokenOverlayRow extends PureComponent<Props> {
  public render() {
    const {} = this.props

    return (
      <IndexList.Row>
        {this.readCell}
        {this.writeCell}
        {this.resourceCell}
      </IndexList.Row>
    )
  }

  private get resourceCell(): JSX.Element {
    const {permission} = this.props
    let resource = `All ${_.upperFirst(permission.resource)}`

    if (permission.id) {
      resource = permission.name
    }

    return <IndexList.Cell>{resource}</IndexList.Cell>
  }

  private get readCell(): JSX.Element {
    const {permission} = this.props
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

  private get writeCell(): JSX.Element {
    const {permission} = this.props
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
}
