import React, {SFC} from 'react'

export interface CancelationProps {
  onCancel: () => void
}

const {Provider, Consumer} = React.createContext<CancelationProps>(null)

export const CancelationProvider: SFC<CancelationProps> = (
  props: CancelationProps & {children?: React.ReactNode}
) => <Provider value={props}>{props.children}</Provider>

type Omit<T, V> = Pick<T, Exclude<keyof T, keyof V>>

export const withCancelation = <P extends CancelationProps>(
  Component: React.ComponentType<P>
) => (props: Omit<P, CancelationProps>) => (
  <Consumer>
    {cancelationProps => <Component {...props} {...cancelationProps} />}
  </Consumer>
)
