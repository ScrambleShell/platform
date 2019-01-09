import {WrappedCancelablePromise} from 'src/types/promises'

export const makeCancelable = <T>(
  promise: Promise<T>
): WrappedCancelablePromise<T> => {
  let isCanceled = false
  let cancel = null

  const wrappedPromise = new Promise<T>(async (resolve, reject) => {
    cancel = reject

    try {
      const value = await promise

      if (!isCanceled) {
        resolve(value)
      }
    } catch (error) {
      if (!isCanceled) {
        reject(error)
      }
    }
  })

  return {
    promise: wrappedPromise,
    cancel() {
      isCanceled = true
      cancel({isCanceled})
    },
  }
}
