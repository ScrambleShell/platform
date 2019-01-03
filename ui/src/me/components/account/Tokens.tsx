// Libraries
import React, {PureComponent, ChangeEvent} from 'react'
import {connect} from 'react-redux'

// Components
import {
  Input,
  Spinner,
  Button,
  ComponentColor,
  OverlayTechnology,
} from 'src/clockface'
import ProfilePageHeader from 'src/shared/components/profile_page/ProfilePageHeader'
import ResourceFetcher from 'src/shared/components/resource_fetcher'
import TokenList from 'src/me/components/account/TokensList'
import FilterList from 'src/shared/components/Filter'
import GenerateTokeOverlay from 'src/me/components/account/GenerateTokenOverlay'

// APIs
import {getAuthorizations} from 'src/authorizations/apis'

// Actions
import {notify} from 'src/shared/actions/notifications'

// Types
import {Authorization} from 'src/api'
import {OverlayState} from 'src/types/v2'

interface State {
  searchTerm: string
  overlayState: OverlayState
}

enum AuthSearchKeys {
  Description = 'description',
  Status = 'status',
}

interface DispatchProps {
  onNotify: typeof notify
}

export class Tokens extends PureComponent<{}, State> {
  constructor(props) {
    super(props)
    this.state = {
      overlayState: OverlayState.Closed,
      searchTerm: '',
    }
  }

  public render() {
    const {onNotify} = this.props
    const {searchTerm} = this.state

    return (
      <>
        <ProfilePageHeader>
          <Input
            value={searchTerm}
            placeholder="Filter tokens by column"
            onChange={this.handleChangeSearchTerm}
            widthPixels={256}
          />
          <Button
            color={ComponentColor.Success}
            text="Generate Token"
            onClick={this.handleShowOverlay}
          />
        </ProfilePageHeader>
        <ResourceFetcher<Authorization[]> fetcher={getAuthorizations}>
          {(fetchedAuths, loading) => (
            <Spinner loading={loading}>
              <FilterList<Authorization>
                list={fetchedAuths}
                searchTerm={searchTerm}
                searchKeys={this.searchKeys}
              >
                {filteredAuths => (
                  <TokenList
                    auths={filteredAuths}
                    onNotify={onNotify}
                    searchTerm={searchTerm}
                  />
                )}
              </FilterList>
            </Spinner>
          )}
        </ResourceFetcher>
        <OverlayTechnology visible={this.overlayVisibility}>
          <GenerateTokeOverlay
            onDismiss={this.handleDismissOverlay}
            onGenerate={this.handleGenerateToken}
          />
        </OverlayTechnology>
      </>
    )
  }

  private get overlayVisibility(): boolean {
    const {overlayState} = this.state

    return overlayState === OverlayState.Open
  }

  private handleShowOverlay = (): void => {
    this.setState({overlayState: OverlayState.Open})
  }

  private handleDismissOverlay = (): void => {
    this.setState({overlayState: OverlayState.Closed})
  }

  private handleChangeSearchTerm = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({searchTerm: e.target.value})
  }

  private get searchKeys(): AuthSearchKeys[] {
    return [AuthSearchKeys.Status, AuthSearchKeys.Description]
  }

  private handleGenerateToken = (authorization: Authorization): void => {
    console.log('bloop', authorization)
  }
}

const mdtp = {
  onNotify: notify,
}

export default connect<null, DispatchProps>(
  null,
  mdtp
)(Tokens)
