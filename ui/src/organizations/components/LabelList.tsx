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
  OverlayTechnology,
} from 'src/clockface'
import UpdateLabelOverlay from 'src/organizations/components/UpdateLabelOverlay'

// Types
import {LabelType} from 'src/clockface'
import {OverlayState} from 'src/types/v2'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  labels: LabelType[]
  emptyState: JSX.Element
  onUpdateLabel: (label: LabelType) => Promise<void>
}

interface State {
  labelID: string
  overlayState: OverlayState
}

@ErrorHandling
export default class LabelList extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      labelID: null,
      overlayState: OverlayState.Closed,
    }
  }

  public render() {
    return (
      <>
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
        <OverlayTechnology visible={this.isOverlayVisible}>
          <UpdateLabelOverlay
            label={this.label}
            onDismiss={this.handleCloseModal}
            onUpdateLabel={this.handleUpdateLabel}
          />
        </OverlayTechnology>
      </>
    )
  }

  private get rows(): JSX.Element[] {
    return this.props.labels.map(label => (
      <IndexList.Row key={label.id}>
        <IndexList.Cell>
          <Label
            id={label.id}
            name={label.name}
            colorHex={label.colorHex}
            description={label.description}
            size={ComponentSize.Small}
            onClick={this.handleStartEdit}
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

  private get label(): LabelType {
    return this.props.labels.find(b => b.id === this.state.labelID)
  }

  private handleCloseModal = () => {
    this.setState({overlayState: OverlayState.Closed})
  }

  private handleStartEdit = (labelID: string): void => {
    this.setState({labelID, overlayState: OverlayState.Open})
  }

  private get isOverlayVisible(): boolean {
    const {labelID, overlayState} = this.state
    return !!labelID && overlayState === OverlayState.Open
  }

  private handleUpdateLabel = async (updatedLabel: LabelType) => {
    await this.props.onUpdateLabel(updatedLabel)
    this.setState({overlayState: OverlayState.Closed})
  }
}
