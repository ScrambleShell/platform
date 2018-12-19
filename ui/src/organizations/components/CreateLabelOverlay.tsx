// Libraries
import React, {Component, ChangeEvent} from 'react'

// Components
import LabelOverlayForm from 'src/organizations/components/LabelOverlayForm'
import {
  OverlayTechnology,
  OverlayContainer,
  OverlayBody,
  OverlayHeading,
} from 'src/clockface'

// Types
import {LabelType} from 'src/clockface'
import {Organization} from 'src/api'

// Constants
import {validateHexCode} from 'src/organizations/constants/LabelColors'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  org: Organization
  isVisible: boolean
  onDismiss: () => void
  onCreateLabel: (org: Organization, label: LabelType) => void
}

const emptyLabel = {
  id: 'newLabel',
  name: '',
  description: '',
  colorHex: '#326BBA',
} as LabelType

interface State {
  label: LabelType
  useCustomColorHex: boolean
}

@ErrorHandling
class CreateLabelOverlay extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      label: emptyLabel,
      useCustomColorHex: false,
    }
  }

  public render() {
    const {isVisible, onDismiss} = this.props
    const {label, useCustomColorHex} = this.state

    return (
      <OverlayTechnology visible={isVisible}>
        <OverlayContainer maxWidth={600}>
          <OverlayHeading title="Create Label" onDismiss={onDismiss} />
          <OverlayBody>
            <LabelOverlayForm
              id={label.id}
              name={label.name}
              description={label.description}
              colorHex={label.colorHex}
              onColorHexChange={this.handleColorHexChange}
              onToggleCustomColorHex={this.handleToggleCustomColorHex}
              useCustomColorHex={useCustomColorHex}
              onSubmit={this.handleSubmit}
              onCloseModal={onDismiss}
              onInputChange={this.handleInputChange}
              buttonText="Create Label"
              isFormValid={this.isFormValid}
            />
          </OverlayBody>
        </OverlayContainer>
      </OverlayTechnology>
    )
  }

  private get isFormValid(): boolean {
    const {label} = this.state

    const nameIsValid = label.name !== ''
    const colorIsValid = validateHexCode(label.colorHex) === null

    return nameIsValid && colorIsValid
  }

  private handleSubmit = () => {
    const {onCreateLabel, org, onDismiss} = this.props

    onCreateLabel(org, this.state.label)
    onDismiss()
  }

  private handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    const key = e.target.name

    if (key in this.state.label) {
      const label = {...this.state.label, [key]: value}

      this.setState({
        label,
      })
    }
  }

  private handleColorHexChange = (colorHex: string): void => {
    const label = {...this.state.label, colorHex}

    this.setState({label})
  }

  private handleToggleCustomColorHex = (useCustomColorHex: boolean): void => {
    this.setState({useCustomColorHex})
  }
}

export default CreateLabelOverlay
