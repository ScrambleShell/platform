// Libraries
import React, {PureComponent, ChangeEvent} from 'react'

// Components
import CreateLabelOverlay from 'src/organizations/components/CreateLabelOverlay'
import ProfilePageHeader from 'src/shared/components/profile_page/ProfilePageHeader'
import {
  ComponentSize,
  EmptyState,
  IconFont,
  Input,
  Button,
  ComponentColor,
  InputType,
} from 'src/clockface'
import LabelList from 'src/organizations/components/LabelList'
import FilterList from 'src/shared/components/Filter'

// API
import {createLabel, deleteLabel, updateLabel} from 'src/organizations/apis'

// Types
import {LabelType} from 'src/clockface'
import {Label, Organization, LabelProperties} from 'src/api'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  labels: Label[]
  org: Organization
}

interface State {
  searchTerm: string
  isOverlayVisible: boolean
  labelTypes: LabelType[]
}

@ErrorHandling
export default class Labels extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      searchTerm: '',
      isOverlayVisible: false,
      labelTypes: this.labelTypes(this.props.labels),
    }
  }

  public render() {
    const {org} = this.props
    const {searchTerm, isOverlayVisible, labelTypes} = this.state

    return (
      <>
        <ProfilePageHeader>
          <Input
            icon={IconFont.Search}
            widthPixels={290}
            type={InputType.Text}
            value={searchTerm}
            onBlur={this.handleFilterBlur}
            onChange={this.handleFilterChange}
            placeholder="Filter Labels..."
          />
          <Button
            text="Create Labels"
            color={ComponentColor.Primary}
            icon={IconFont.Plus}
            onClick={this.handleShowOverlay}
          />
        </ProfilePageHeader>
        <FilterList<LabelType>
          list={labelTypes}
          searchKeys={['name', 'description']}
          searchTerm={searchTerm}
        >
          {ls => (
            <LabelList
              labels={ls}
              emptyState={this.emptyState}
              onUpdateLabel={this.handleUpdateLabel}
            />
          )}
        </FilterList>
        <CreateLabelOverlay
          org={org}
          isVisible={isOverlayVisible}
          onDismiss={this.handleDismissOverlay}
          onCreateLabel={this.handleCreateLabel}
        />
      </>
    )
  }

  private handleShowOverlay = (): void => {
    this.setState({isOverlayVisible: true})
  }

  private handleDismissOverlay = (): void => {
    this.setState({isOverlayVisible: false})
  }

  private handleFilterChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({searchTerm: e.target.value})
  }

  private handleFilterBlur = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({searchTerm: e.target.value})
  }

  private handleCreateLabel = async (
    org: Organization,
    labelType: LabelType
  ) => {
    const newLabel = await createLabel(org, {
      name: labelType.name,
      properties: this.labelProperties(labelType),
    })
    const labelTypes = this.labelTypes([...this.props.labels, newLabel])
    this.setState({labelTypes})
  }

  private handleUpdateLabel = async (labelType: LabelType) => {
    const label = await updateLabel(this.props.org, {
      name: labelType.name,
      properties: this.labelProperties(labelType),
    })

    const labelTypes = this.state.labelTypes.map(l => {
      if (l.id === labelType.id) {
        return this.labelType(label)
      }

      return l
    })

    this.setState({labelTypes})
  }

  private labelTypes(labels: Label[]): LabelType[] {
    return labels.map(this.labelType)
  }

  private labelType(label: Label): LabelType {
    const {properties} = label

    return {
      id: label.name,
      name: label.name,
      description: properties.description,
      colorHex: properties.color,
      onDelete: this.handleDelete,
    }
  }

  private handleDelete = async (name: string) => {
    const {org, labels} = this.props
    const label = labels.find(label => label.name === name)

    await deleteLabel(org, label)
    const labelTypes = this.state.labelTypes.filter(l => l.id !== name)

    this.setState({labelTypes})
  }

  private labelProperties(labelType: LabelType): LabelProperties {
    return {
      description: labelType.description,
      color: labelType.colorHex,
    }
  }

  private get emptyState(): JSX.Element {
    const {searchTerm} = this.state

    let emptyText = "This organization doesn't have any Labels yet"

    if (searchTerm) {
      emptyText = 'No Labels match your search term'
    }

    return (
      <EmptyState size={ComponentSize.Medium}>
        <EmptyState.Text text={emptyText} />
      </EmptyState>
    )
  }
}
