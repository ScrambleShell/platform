// Libraries
import React, {Component} from 'react'

// Components
import {Dropdown, DropdownMenuColors} from 'src/clockface'

// Constants
import {
  PresetLabelColors,
  LabelColor,
  LabelColorType,
} from 'src/organizations/constants/LabelColors'

// Styles
import 'src/organizations/components/LabelColorDropdown.scss'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  colorHex: string
  onChange: (colorHex: string) => void
  onToggleCustomColorHex: (useCustomColorHex: boolean) => void
  useCustomColorHex: boolean
}

@ErrorHandling
class LabelColorDropdown extends Component<Props> {
  public render() {
    return (
      <Dropdown
        selectedID={this.selectedColorID}
        onChange={this.handleChange}
        menuColor={DropdownMenuColors.Onyx}
      >
        {PresetLabelColors.map(preset => {
          if (preset.type === LabelColorType.Preset) {
            return (
              <Dropdown.Item id={preset.id} key={preset.id} value={preset}>
                <div className="label-colors--item">
                  <div
                    className="label-colors--swatch"
                    style={{backgroundColor: preset.hex}}
                  />
                  {preset.name}
                </div>
              </Dropdown.Item>
            )
          } else if (preset.type === LabelColorType.Custom) {
            return (
              <Dropdown.Item id={preset.id} key={preset.id} value={preset}>
                <div className="label-colors--item">
                  <div className="label-colors--custom" />
                  {preset.name}
                </div>
              </Dropdown.Item>
            )
          }
        })}
      </Dropdown>
    )
  }

  private get selectedColorID(): string {
    const {colorHex, useCustomColorHex} = this.props

    const {id} = PresetLabelColors.find(preset => preset.hex === colorHex)

    if (useCustomColorHex) {
      const customColor = PresetLabelColors.find(
        preset => preset.type === LabelColorType.Custom
      )
      return customColor.id
    }

    return id
  }

  private handleChange = (color: LabelColor): void => {
    const {onChange, onToggleCustomColorHex} = this.props
    const {hex, type} = color

    if (type === LabelColorType.Preset) {
      onToggleCustomColorHex(false)
      onChange(hex)
    } else if (type === LabelColorType.Custom) {
      onToggleCustomColorHex(true)
    }
  }
}

export default LabelColorDropdown
