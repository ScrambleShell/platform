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
  ComponentStatus,
  ComponentSpacer,
  ButtonType,
  Label,
  Columns,
  Alignment,
  Stack,
} from 'src/clockface'
import LabelColorDropdown from 'src/organizations/components/LabelColorDropdown'

// Constants
const MAX_LABEL_CHARS = 75

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  id: string
  name: string
  description: string
  colorHex: string
  nameInputErrorMessage: string
  customColorHexErrorMessage: string
  onSubmit: () => void
  onCloseModal: () => void
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onColorHexChange: (colorHex: string) => void
  onToggleCustomColorHex: (useCustomColorHex: boolean) => void
  useCustomColorHex: boolean
  nameInputStatus: ComponentStatus
  buttonText: string
}

@ErrorHandling
export default class BucketOverlayForm extends PureComponent<Props> {
  public render() {
    const {
      id,
      name,
      onSubmit,
      colorHex,
      buttonText,
      description,
      onCloseModal,
      onInputChange,
      nameInputStatus,
      onColorHexChange,
      useCustomColorHex,
      nameInputErrorMessage,
      onToggleCustomColorHex,
      customColorHexErrorMessage,
    } = this.props

    return (
      <Form onSubmit={onSubmit}>
        <Grid>
          <Grid.Row>
            <Grid.Column widthXS={Columns.Twelve}>
              <Form.Element label="Preview">
                <Form.Box>
                  <Label
                    size={ComponentSize.Small}
                    name={this.placeholderLabelName}
                    description={description}
                    colorHex={colorHex}
                    id={id}
                  />
                </Form.Box>
              </Form.Element>
            </Grid.Column>
            <Grid.Column widthSM={Columns.Seven}>
              <Form.Element label="Name" errorMessage={nameInputErrorMessage}>
                <Input
                  placeholder="Name this Label"
                  name="name"
                  autoFocus={true}
                  value={name}
                  onChange={onInputChange}
                  status={nameInputStatus}
                  maxLength={MAX_LABEL_CHARS}
                />
              </Form.Element>
            </Grid.Column>
            <Grid.Column widthSM={Columns.Five}>
              <Form.Element
                label="Color"
                errorMessage={customColorHexErrorMessage}
              >
                <ComponentSpacer
                  align={Alignment.Left}
                  stackChildren={Stack.Rows}
                >
                  <LabelColorDropdown
                    colorHex={colorHex}
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
                  autoFocus={true}
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
                <Button text={buttonText} color={ComponentColor.Success} />
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

  private get customColorInput(): JSX.Element {
    const {colorHex, useCustomColorHex} = this.props

    if (useCustomColorHex) {
      return (
        <Input
          value={colorHex}
          placeholder="#000000"
          onChange={this.handleCustomColorChange}
        />
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
