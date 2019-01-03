// Libraries
import React, {PureComponent, ChangeEvent} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'

// APIs
import {getBuckets} from 'src/organizations/apis'

// Components
import {
  OverlayContainer,
  OverlayHeading,
  OverlayBody,
  Grid,
  Columns,
  Form,
  Button,
  ComponentColor,
  ComponentStatus,
  Spinner,
} from 'src/clockface'
import TokenDescriptionInput from 'src/me/components/account/TokenDescriptionInput'
import TokenOrgDropdown from 'src/me/components/account/TokenOrgDropdown'
import SelectedPermissions from 'src/me/components/account/permissions/SelectedPermissions'
import PermissionsBrowser from 'src/me/components/account/permissions/PermissionsBrowser'
import GetOrgResources from 'src/organizations/components/GetOrgResources'

// Types
import {Organization, Bucket} from 'src/types/v2'
import {Authorization, Permission} from 'src/api'

interface StateProps {
  orgs: Organization[]
}

interface ComponentProps {
  onGenerate: (authorization: Authorization) => void
  onDismiss: () => void
}

interface State {
  description: string
  orgID: string
  permissions: Permission[]
}

type Props = StateProps & ComponentProps

class GenerateTokenOverlay extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      description: '',
      orgID: props.orgs[0].id,
      permissions: [],
    }
  }

  public render() {
    const {description, orgID, permissions} = this.state
    const {onDismiss, orgs} = this.props

    return (
      <OverlayContainer maxWidth={720}>
        <OverlayHeading title="Generate Token" onDismiss={onDismiss} />
        <OverlayBody>
          <Form>
            <Grid>
              <Grid.Row>
                <Grid.Column widthSM={Columns.Six}>
                  <TokenDescriptionInput
                    description={description}
                    onChange={this.handleDescriptionChange}
                  />
                </Grid.Column>
                <Grid.Column widthSM={Columns.Six}>
                  <TokenOrgDropdown
                    organizations={orgs}
                    selectedOrgID={orgID}
                    onChange={this.handleDropdownChange}
                  />
                </Grid.Column>
                <Grid.Column widthXS={Columns.Twelve}>
                  <SelectedPermissions
                    permissions={permissions}
                    onRemovePermission={this.handleRemovePermission}
                    onUpdatePermission={this.handleUpdatePermission}
                  />
                </Grid.Column>
                <Grid.Column widthXS={Columns.Twelve}>
                  <GetOrgResources<Bucket[]>
                    organization={this.selectedOrganization}
                    fetcher={getBuckets}
                  >
                    {(buckets, loading) => (
                      <Spinner loading={loading}>
                        <PermissionsBrowser
                          buckets={buckets}
                          onAddPermission={this.handleAddPermission}
                        />
                      </Spinner>
                    )}
                  </GetOrgResources>
                </Grid.Column>
                <Grid.Column widthXS={Columns.Twelve}>
                  <Form.Footer>
                    <Button text="Cancel" onClick={onDismiss} />
                    <Button
                      text="Generate Token"
                      color={ComponentColor.Primary}
                      status={this.submitButtonStatus}
                      onClick={this.handleFormSubmit}
                    />
                  </Form.Footer>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Form>
        </OverlayBody>
      </OverlayContainer>
    )
  }

  private handleDescriptionChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    const description = e.target.value

    this.setState({description})
  }

  private handleDropdownChange = (orgID: string): void => {
    this.setState({orgID})
  }

  private handleFormSubmit = (): void => {
    const {onGenerate} = this.props
    const {orgID, permissions, description} = this.state

    const authorization = {orgID, permissions, description}
    onGenerate(authorization)
  }

  private get isFormValid(): boolean {
    const {description, orgID, permissions} = this.state

    if (!description || !orgID || !permissions.length) {
      return false
    }

    return true
  }

  private handleAddPermission = (permission: Permission): void => {
    const permissions = [...this.state.permissions, permission]

    this.setState({permissions})
  }

  private handleRemovePermission = (permission: Permission): void => {
    const permissions = this.state.permissions.filter(
      p => !_.isEqual(p, permission)
    )

    this.setState({permissions})
  }

  private handleUpdatePermission = (permission: Permission): void => {
    let permissions = []

    if (permission.id) {
      permissions = this.state.permissions.map(p => {
        if (p.id === permission.id) {
          return permission
        }

        return p
      })
    } else {
      permissions = this.state.permissions.map(p => {
        if (p.resource === permission.resource) {
          return permission
        }

        return p
      })
    }

    this.setState({permissions})
  }

  private get submitButtonStatus(): ComponentStatus {
    if (this.isFormValid) {
      return ComponentStatus.Default
    }

    return ComponentStatus.Disabled
  }

  private get selectedOrganization(): Organization {
    const {orgs} = this.props
    const {orgID} = this.state

    return orgs.find(o => o.id === orgID)
  }
}

const mstp = (state): StateProps => {
  const {orgs} = state

  return {orgs}
}

export default connect<StateProps>(mstp)(GenerateTokenOverlay)
