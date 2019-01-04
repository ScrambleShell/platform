// Libraries
import React, {Component, KeyboardEvent, ChangeEvent} from 'react'

// Constants
import {DASHBOARD_NAME_MAX_LENGTH} from 'src/dashboards/constants/index'

// Components
import {ClickOutside} from 'src/shared/components/ClickOutside'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  onRename: (name: string) => void
  name: string
}

interface State {
  isEditing: boolean
  workingName: string
}

@ErrorHandling
class RenameDashboard extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      isEditing: false,
      workingName: this.props.name,
    }
  }

  public render() {
    const {name} = this.props
    const {isEditing, workingName} = this.state

    if (isEditing) {
      return (
        <div className="rename-dashboard">
          <ClickOutside onClickOutside={this.handleClickOutside}>
            <input
              maxLength={DASHBOARD_NAME_MAX_LENGTH}
              type="text"
              value={workingName}
              autoFocus={true}
              spellCheck={false}
              placeholder="Name this Dashboard"
              onFocus={this.handleInputFocus}
              onChange={this.handleInputChange}
              onKeyDown={this.handleKeyDown}
              className="rename-dashboard--input"
            />
          </ClickOutside>
        </div>
      )
    }

    return (
      <div className="rename-dashboard">
        <div
          className="rename-dashboard--title"
          onClick={this.handleStartEditing}
        >
          {name}
          <span className="icon pencil" />
        </div>
      </div>
    )
  }

  private handleClickOutside = async (): Promise<void> => {
    const {workingName} = this.state
    const {onRename} = this.props

    await onRename(workingName)

    this.setState({isEditing: false})
  }

  private handleStartEditing = (): void => {
    this.setState({isEditing: true})
  }

  private handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({workingName: e.target.value})
  }

  private handleKeyDown = async (
    e: KeyboardEvent<HTMLInputElement>
  ): Promise<void> => {
    const {onRename, name} = this.props
    const {workingName} = this.state

    if (e.key === 'Enter') {
      await onRename(workingName)
      this.setState({isEditing: false})
    }

    if (e.key === 'Escape') {
      this.setState({isEditing: false, workingName: name})
    }
  }

  private handleInputFocus = (e: ChangeEvent<HTMLInputElement>): void => {
    e.currentTarget.select()
  }
}

export default RenameDashboard
