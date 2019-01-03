// Libraries
import React, {Component} from 'react'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  label: string
  children?: JSX.Element
  required?: boolean
  title?: string
}

@ErrorHandling
class FormLabel extends Component<Props> {
  public render() {
    const {label, children, title} = this.props

    return (
      <label className="form--label" title={title}>
        <span>
          {label}
          {this.requiredIndicator}
        </span>
        {children}
      </label>
    )
  }

  private get requiredIndicator(): JSX.Element {
    const {required} = this.props

    if (required) {
      return <span className="form--label-required">*</span>
    }
  }
}

export default FormLabel
