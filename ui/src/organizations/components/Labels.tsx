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
} from 'src/clockface'
import LabelList from 'src/organizations/components/LabelList'
import FilterList from 'src/shared/components/Filter'

// Types
import {LabelType} from 'src/clockface'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  labels: LabelType[]
}

interface State {
  searchTerm: string
  isOverlayVisible: boolean
}

@ErrorHandling
export default class Members extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      searchTerm: '',
      isOverlayVisible: false,
    }
  }

  public render() {
    const {labels} = this.props
    const {searchTerm, isOverlayVisible} = this.state

    return (
      <>
        <ProfilePageHeader>
          <Input
            icon={IconFont.Search}
            widthPixels={290}
            value={searchTerm}
            onBlur={this.handleFilterBlur}
            onChange={this.handleFilterChange}
            placeholder="Filter Labels..."
          />
          <Button
            text="Create Label"
            color={ComponentColor.Primary}
            icon={IconFont.Plus}
            onClick={this.handleShowOverlay}
          />
        </ProfilePageHeader>
        <FilterList<LabelType>
          list={labels}
          searchKeys={['name', 'description']}
          searchTerm={searchTerm}
        >
          {ls => <LabelList labels={ls} emptyState={this.emptyState} />}
        </FilterList>
        <CreateLabelOverlay
          isVisible={isOverlayVisible}
          onDismiss={this.handleDismissOverlay}
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
