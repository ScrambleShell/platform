// Libraries
import React, {PureComponent} from 'react'

// Components
import {
  IndexList,
  Label,
  ComponentSize,
  Button,
  ComponentColor,
  Alignment,
} from 'src/clockface'

// Types
import {LabelType} from 'src/clockface'

interface Props {
  labels: LabelType[]
  emptyState: JSX.Element
}

export default class MemberList extends PureComponent<Props> {
  public render() {
    return (
      <IndexList>
        <IndexList.Header>
          <IndexList.HeaderCell columnName="Name" width="20%" />
          <IndexList.HeaderCell columnName="Description" width="55%" />
          <IndexList.HeaderCell width="25%" />
        </IndexList.Header>
        <IndexList.Body columnCount={3} emptyState={this.props.emptyState}>
          {this.rows}
        </IndexList.Body>
      </IndexList>
    )
  }

  private get rows(): JSX.Element[] {
    return this.props.labels.map(label => (
      <IndexList.Row key={label.id}>
        <IndexList.Cell>
          <Label
            id={label.id}
            text={label.text}
            colorHex={label.colorHex}
            description={label.description}
            size={ComponentSize.Small}
          />
        </IndexList.Cell>
        <IndexList.Cell>{label.description}</IndexList.Cell>
        <IndexList.Cell revealOnHover={true} alignment={Alignment.Right}>
          <Button
            text="Delete"
            color={ComponentColor.Danger}
            size={ComponentSize.ExtraSmall}
          />
        </IndexList.Cell>
      </IndexList.Row>
    ))
  }
}
