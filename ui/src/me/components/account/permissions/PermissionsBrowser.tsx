// Libraries
import React, {PureComponent} from 'react'

// Components
import FancyScrollbar from 'src/shared/components/fancy_scrollbar/FancyScrollbar'
import PermissionBrowserItem from 'src/me/components/account/permissions/PermissionsBrowserItem'

// Types
import {Bucket} from 'src/types/v2'

// Styles
import 'src/me/components/account/permissions/PermissionsBrowser.scss'

interface Props {
  buckets: Bucket[]
  onAddPermission: (Bucket) => void
}

export default class PermissionsBrowser extends PureComponent<Props> {
  public render() {
    return (
      <div className="permissions-browser">
        <ul className="permissions-browser--tabs">
          <li className="permissions-browser--tab active">Buckets</li>
        </ul>
        <FancyScrollbar
          className="permissions-browser--scrollbox"
          autoHeight={true}
          maxHeight={300}
        >
          {this.items}
        </FancyScrollbar>
      </div>
    )
  }

  private get items(): JSX.Element[] | JSX.Element {
    const {buckets, onAddPermission} = this.props

    if (buckets.length) {
      return (
        <>
          <PermissionBrowserItem onClick={onAddPermission} />
          {buckets.map(b => (
            <PermissionBrowserItem
              key={b.id}
              bucket={b}
              onClick={onAddPermission}
            />
          ))}
        </>
      )
    }

    return <div>This org doesn't have any buckets</div>
  }
}
