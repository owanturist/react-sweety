import { Compare, SetSweetyState } from "./utils"
import { Sweety } from "./Sweety"
import { useGetSweetyState } from "./useGetSweetyState"
import { useSetSweetyState } from "./useSetSweetyState"

/**
 * A hook that is similar to `React.useState` but for `Sweety` instances.
 * It subscribes to the store changes and returns the current value and a function to set the value.
 * The store won't update if the new value is comparably equal to the current value.
 *
 * @param store a `Sweety` instance.
 * @param compare an optional compare function with medium priority.
 * If not defined it uses `Sweety#compare`.
 * The strict equality check function (`===`) will be used if `null`.
 *
 * @see {@link Sweety.getState}
 * @see {@link Sweety.setState}
 * @see {@link Sweety.subscribe}
 * @see {@link useGetSweetyState}
 * @see {@link useSetSweetyState}
 * @see {@link Compare}
 */
export function useSweetyState<T>(
  store: Sweety<T>,
  compare?: null | Compare<T>,
): [T, SetSweetyState<T>]

/**
 * The hook that is similar to `React.useState` but for `Sweety` instances.
 * It subscribes to the store changes and returns the current value and a function to set the value.
 * The store won't update if the new value is comparably equal to the current value.
 *
 * @param store a `Sweety` instance but can be `null` or `undefined` as a bypass when there is no need to subscribe to the store's changes.
 * @param compare an optional compare function with medium priority.
 * If not defined it uses `Sweety#compare`.
 * The strict equality check function (`===`) will be used if `null`.
 *
 * @see {@link Sweety.getState}
 * @see {@link Sweety.setState}
 * @see {@link Sweety.subscribe}
 * @see {@link useGetSweetyState}
 * @see {@link useSetSweetyState}
 * @see {@link Compare}
 */
export function useSweetyState<T>(
  store: null | Sweety<T>,
  compare?: null | Compare<T>,
): [null | T, SetSweetyState<T>]

/**
 * A hook that is similar to `React.useState` but for `Sweety` instances.
 * It subscribes to the store changes and returns the current value and a function to set the value.
 * The store won't update if the new value is comparably equal to the current value.
 *
 * @param store a `Sweety` instance but can be `null` or `undefined` as a bypass when there is no need to subscribe to the store's changes.
 * @param compare an optional compare function with medium priority.
 * If not defined it uses `Sweety#compare`.
 * The strict equality check function (`===`) will be used if `null`.
 *
 * @see {@link Sweety.getState}
 * @see {@link Sweety.setState}
 * @see {@link Sweety.subscribe}
 * @see {@link useGetSweetyState}
 * @see {@link useSetSweetyState}
 * @see {@link Compare}
 */
export function useSweetyState<T>(
  store: undefined | Sweety<T>,
  compare?: null | Compare<T>,
): [undefined | T, SetSweetyState<T>]

/**
 * A hook that is similar to `React.useState` but for `Sweety` instances.
 * It subscribes to the store changes and returns the current value and a function to set the value.
 * The store won't update if the new value is comparably equal to the current value.
 *
 * @param store a `Sweety` instance but can be `null` or `undefined` as a bypass when there is no need to subscribe to the store's changes.
 * @param compare an optional compare function with medium priority.
 * If not defined it uses `Sweety#compare`.
 * The strict equality check function (`===`) will be used if `null`.
 *
 * @see {@link Sweety.getState}
 * @see {@link Sweety.setState}
 * @see {@link Sweety.subscribe}
 * @see {@link useGetSweetyState}
 * @see {@link useSetSweetyState}
 * @see {@link Compare}
 */
export function useSweetyState<T>(
  store: null | undefined | Sweety<T>,
  compare?: null | Compare<T>,
): [null | undefined | T, SetSweetyState<T>]

export function useSweetyState<T>(
  store: null | undefined | Sweety<T>,
  compare?: null | Compare<T>,
): [null | undefined | T, SetSweetyState<T>] {
  return [useGetSweetyState(store), useSetSweetyState(store, compare)]
}