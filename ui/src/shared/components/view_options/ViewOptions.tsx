// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

// Actions
import {setType} from 'src/shared/actions/v2/timeMachines'

// Components
import OptionsSwitcher from 'src/shared/components/view_options/OptionsSwitcher'
import FancyScrollbar from 'src/shared/components/fancy_scrollbar/FancyScrollbar'

// Utils
import {getActiveTimeMachine} from 'src/shared/selectors/timeMachines'

// Types
import {View, NewView, AppState} from 'src/types/v2'

interface DispatchProps {
  onUpdateType: typeof setType
}

interface StateProps {
  view: View | NewView
}

type Props = DispatchProps & StateProps

class ViewOptions extends PureComponent<Props> {
  public render() {
    const {view} = this.props

    return (
      <FancyScrollbar autoHide={false} className="veo--view-options-container">
        <div className="veo--view-options">
          <OptionsSwitcher view={view} />
        </div>
      </FancyScrollbar>
    )
  }
}

const mstp = (state: AppState): StateProps => {
  const {view} = getActiveTimeMachine(state)

  return {view}
}

const mdtp: DispatchProps = {
  onUpdateType: setType,
}
export default connect<StateProps, DispatchProps, {}>(
  mstp,
  mdtp
)(ViewOptions)
