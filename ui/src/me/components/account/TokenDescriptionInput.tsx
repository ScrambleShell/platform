// Libraries
import React, {Component, ChangeEvent} from 'react'

// Components
import {Form, Input} from 'src/clockface'

interface Props {
  description: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

class TokenDescriptionInput extends Component<Props> {
  public render() {
    const {description, onChange} = this.props

    return (
      <Form.ValidationElement
        label="Description"
        value={description}
        validationFunc={this.handleValidation}
      >
        {status => (
          <Input
            autoFocus={true}
            placeholder="What will this token be used for?"
            value={description}
            onChange={onChange}
            status={status}
          />
        )}
      </Form.ValidationElement>
    )
  }

  private handleValidation = (description: string): string | null => {
    if (!description) {
      return 'This field is required'
    }

    return null
  }
}

export default TokenDescriptionInput
