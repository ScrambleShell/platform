// Libraries
import React, {Component, ChangeEvent} from 'react'

// Components
import LabelOverlayForm from 'src/organizations/components/LabelOverlayForm'
import {
  OverlayTechnology,
  OverlayContainer,
  OverlayBody,
  OverlayHeading,
  ComponentStatus,
} from 'src/clockface'

// Types
import {LabelType} from 'src/clockface'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  isVisible: boolean
  onDismiss: () => void
}

const emptyLabel = {
  id: 'newLabel',
  name: '',
  description: '',
  colorHex: '#326BBA',
} as LabelType

interface State {
  label: LabelType
  nameInputStatus: ComponentStatus
  nameInputErrorMessage: string
  useCustomColorHex: boolean
  customColorHex: string
  customColorHexErrorMessage: string
}

@ErrorHandling
class CreateLabelOverlay extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      label: emptyLabel,
      nameInputStatus: ComponentStatus.Default,
      nameInputErrorMessage: '',
      useCustomColorHex: false,
      customColorHex: '',
      customColorHexErrorMessage: '',
    }
  }

  public render() {
    const {isVisible, onDismiss} = this.props
    const {
      label,
      nameInputStatus,
      nameInputErrorMessage,
      useCustomColorHex,
      customColorHexErrorMessage,
    } = this.state

    return (
      <OverlayTechnology visible={isVisible}>
        <OverlayContainer maxWidth={600}>
          <OverlayHeading title="Create Label" onDismiss={onDismiss} />
          <OverlayBody>
            <LabelOverlayForm
              id={label.id}
              name={label.name}
              nameInputStatus={nameInputStatus}
              description={label.description}
              colorHex={label.colorHex}
              onColorHexChange={this.handleColorHexChange}
              onToggleCustomColorHex={this.handleToggleCustomColorHex}
              useCustomColorHex={useCustomColorHex}
              customColorHexErrorMessage={customColorHexErrorMessage}
              nameInputErrorMessage={nameInputErrorMessage}
              onSubmit={() => {}}
              onCloseModal={onDismiss}
              onInputChange={this.handleInputChange}
              buttonText="Create Label"
            />
          </OverlayBody>
        </OverlayContainer>
      </OverlayTechnology>
    )
  }

  private handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    const key = e.target.name

    if (key in this.state.label) {
      const label = {...this.state.label, [key]: value}

      if (!value && key === 'name') {
        return this.setState({
          label,
          nameInputStatus: ComponentStatus.Error,
          nameInputErrorMessage: `Label ${key} cannot be empty`,
        })
      }

      if (key === 'name') {
        return this.setState({
          label,
          nameInputStatus: ComponentStatus.Valid,
          nameInputErrorMessage: '',
        })
      }

      this.setState({
        label,
      })
    }
  }

  private handleColorHexChange = (colorHex: string): void => {
    const label = {...this.state.label, colorHex}

    const isHexValid = this.validateColorHex(colorHex)

    if (isHexValid) {
      return this.setState({
        label,
        customColorHex: colorHex,
        customColorHexErrorMessage: '',
      })
    }

    this.setState({
      customColorHex: colorHex,
      customColorHexErrorMessage:
        'Hexcodes must be 7 characters limited to A-F, 0-9, and begin with #',
    })
  }

  private handleToggleCustomColorHex = (useCustomColorHex: boolean): void => {
    this.setState({useCustomColorHex})
  }

  private validateColorHex = (colorHex): boolean => {
    const isValidLength = colorHex.length === 7
    const containsValidCharacters =
      colorHex.replace(/[ABCDEF0abcdef123456789]+/g, '') === '#'

    if (!isValidLength || !containsValidCharacters) {
      return false
    }

    return true
  }
}

export default CreateLabelOverlay
