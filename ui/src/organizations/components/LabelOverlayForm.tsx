// Libraries
import React, {PureComponent, ChangeEvent} from 'react'

// Components
import {
  Grid,
  Form,
  Input,
  Button,
  ComponentColor,
  ComponentSize,
  ComponentSpacer,
  ButtonType,
  Label,
  Columns,
  Alignment,
  Stack,
  ComponentStatus,
} from 'src/clockface'
import LabelColorDropdown from 'src/organizations/components/LabelColorDropdown'

// Constants
import {
  PresetLabelColors,
  LabelColorType,
  HEX_CODE_CHAR_LENGTH,
  validateHexCode,
} from 'src/organizations/constants/LabelColors'
const MAX_LABEL_CHARS = 75

// Styles
import 'src/organizations/components/LabelOverlayForm.scss'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  id: string
  name: string
  description: string
  colorHex: string
  onSubmit: () => void
  onCloseModal: () => void
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onColorHexChange: (colorHex: string) => void
  onToggleCustomColorHex: (useCustomColorHex: boolean) => void
  useCustomColorHex: boolean
  buttonText: string
  isFormValid: boolean
}

@ErrorHandling
export default class BucketOverlayForm extends PureComponent<Props> {
  public render() {
    const {
      id,
      name,
      onSubmit,
      buttonText,
      description,
      onCloseModal,
      onInputChange,
      onColorHexChange,
      useCustomColorHex,
      onToggleCustomColorHex,
      isFormValid,
    } = this.props

    return (
      <Form onSubmit={onSubmit}>
        <Grid>
          <Grid.Row>
            <Grid.Column widthXS={Columns.Twelve}>
              <Form.Element label="Preview">
                <Form.Box className="label-overlay--preview">
                  <Label
                    size={ComponentSize.Small}
                    name={this.placeholderLabelName}
                    description={description}
                    colorHex={this.colorHexGuard}
                    id={id}
                  />
                </Form.Box>
              </Form.Element>
            </Grid.Column>
            <Grid.Column widthSM={Columns.Seven}>
              <Form.ValidationElement
                label="Name"
                value={name}
                required={true}
                validationFunc={this.handleNameValidation}
              >
                {status => (
                  <Input
                    placeholder="Name this Label"
                    name="name"
                    autoFocus={true}
                    value={name}
                    onChange={onInputChange}
                    status={status}
                    maxLength={MAX_LABEL_CHARS}
                  />
                )}
              </Form.ValidationElement>
            </Grid.Column>
            <Grid.Column widthSM={Columns.Five}>
              <Form.Element label="Color">
                <ComponentSpacer
                  align={Alignment.Left}
                  stackChildren={Stack.Rows}
                >
                  <LabelColorDropdown
                    colorHex={this.dropdownColorHex}
                    onChange={onColorHexChange}
                    useCustomColorHex={useCustomColorHex}
                    onToggleCustomColorHex={onToggleCustomColorHex}
                  />
                  {this.customColorInput}
                </ComponentSpacer>
              </Form.Element>
            </Grid.Column>
            <Grid.Column widthXS={Columns.Twelve}>
              <Form.Element label="Description">
                <Input
                  placeholder="Add a optional description"
                  name="description"
                  value={description}
                  onChange={onInputChange}
                />
              </Form.Element>
            </Grid.Column>
            <Grid.Column widthXS={Columns.Twelve}>
              <Form.Footer>
                <Button
                  text="Cancel"
                  onClick={onCloseModal}
                  titleText="Cancel creation of Label and return to list"
                  type={ButtonType.Button}
                />
                <Button
                  text={buttonText}
                  color={ComponentColor.Success}
                  status={
                    isFormValid
                      ? ComponentStatus.Default
                      : ComponentStatus.Disabled
                  }
                />
              </Form.Footer>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Form>
    )
  }

  private get placeholderLabelName(): string {
    const {name} = this.props

    if (!name) {
      return 'Name this Label'
    }

    return name
  }

  private get colorHexGuard(): string {
    const {colorHex} = this.props

    if (validateHexCode(colorHex)) {
      return '#0F0E15'
    }

    return colorHex
  }

  private get dropdownColorHex(): string {
    const {colorHex, useCustomColorHex} = this.props

    if (useCustomColorHex) {
      return PresetLabelColors.find(
        preset => preset.type === LabelColorType.Custom
      ).hex
    }

    return colorHex
  }

  private handleNameValidation = (name: string): string | null => {
    if (name === '') {
      return 'Name is required'
    }

    return null
  }

  private get customColorInput(): JSX.Element {
    const {colorHex, useCustomColorHex} = this.props

    if (useCustomColorHex) {
      return (
        <Form.ValidationElement
          label="Enter a Hexcode"
          value={colorHex}
          validationFunc={validateHexCode}
        >
          {status => (
            <Input
              value={colorHex}
              placeholder="#000000"
              onChange={this.handleCustomColorChange}
              status={status}
              autoFocus={true}
              maxLength={HEX_CODE_CHAR_LENGTH}
            />
          )}
        </Form.ValidationElement>
      )
    }
  }

  private handleCustomColorChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    const {onColorHexChange} = this.props

    onColorHexChange(e.target.value)
  }
}
