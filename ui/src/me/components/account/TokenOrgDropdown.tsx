// Libraries
import React, {PureComponent} from 'react'

// Components
import {Dropdown, Form} from 'src/clockface'

// Types
import {Organization} from 'src/api'

interface Props {
  organizations: Organization[]
  selectedOrgID: string
  onChange: (orgID: string) => void
}

class TokenOrgDropdown extends PureComponent<Props> {
  public render() {
    const {selectedOrgID, onChange, organizations} = this.props

    if (!organizations) {
      return null
    }

    return (
      <Form.Element label="Organization">
        <Dropdown selectedID={selectedOrgID} onChange={onChange}>
          {this.dropdownItems}
        </Dropdown>
      </Form.Element>
    )
  }

  private get dropdownItems(): JSX.Element[] {
    const {organizations} = this.props
    return organizations.map(o => (
      <Dropdown.Item key={o.id} id={o.id} value={o.id}>
        {o.name}
      </Dropdown.Item>
    ))
  }
}

export default TokenOrgDropdown
