// Libraries
import React, {PureComponent} from 'react'

// Components
import {Dropdown, Form} from 'src/clockface'

// Types
import {Organization} from 'src/api'

// Mocks
const mockOrgs: Organization[] = [
  {
    id: '0',
    name: 'Cool Kids Club',
  },
  {
    id: '1',
    name: '44th Street Tigers',
  },
  {
    id: '3',
    name: 'Pumpkin Smashers',
  },
  {
    id: '4',
    name: 'Dark Soul Devils',
  },
]

interface Props {
  selectedOrgID: string
  onChange: (orgID: string) => void
}

class TokenOrgDropdown extends PureComponent<Props> {
  public render() {
    const {selectedOrgID, onChange} = this.props

    return (
      <Form.Element label="Organization">
        <Dropdown selectedID={selectedOrgID} onChange={onChange}>
          {this.dropdownItems}
        </Dropdown>
      </Form.Element>
    )
  }

  private get dropdownItems(): JSX.Element[] {
    return mockOrgs.map(o => (
      <Dropdown.Item key={o.id} id={o.id} value={o.id}>
        {o.name}
      </Dropdown.Item>
    ))
  }
}

export default TokenOrgDropdown
