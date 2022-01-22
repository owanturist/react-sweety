import { SetStateAction } from "react"
import { nanoid } from "nanoid"

import { Compare, isEqual, noop } from "./utils"
import { WatchStore, WatchContext, WatcherPermission } from "./WatchContext"
import { SetStateContext } from "./SetStateContext"

type ExtractDirect<T> = T extends InnerStore<infer R> ? R : T

/**
 * A helper type that shallowly extracts value type from `InnerStore`.
 */
export type ExtractInnerState<T> = T extends InnerStore<infer R>
  ? R
  : T extends Array<infer R>
  ? Array<ExtractDirect<R>>
  : T extends ReadonlyArray<infer R>
  ? ReadonlyArray<ExtractDirect<R>>
  : { [K in keyof T]: ExtractDirect<T[K]> }

type ExtractDeepDirect<T> = T extends InnerStore<infer R>
  ? DeepExtractInnerState<R>
  : T

/**
 * A helper that deeply extracts value type from `InnerStore`.
 */
export type DeepExtractInnerState<T> = T extends InnerStore<infer R>
  ? DeepExtractInnerState<R>
  : T extends Array<infer R>
  ? Array<ExtractDeepDirect<R>>
  : T extends ReadonlyArray<infer R>
  ? ReadonlyArray<ExtractDeepDirect<R>>
  : { [K in keyof T]: ExtractDeepDirect<T[K]> }

export class InnerStore<T> implements WatchStore {
  /**
   * Creates a new `InnerStore` instance.
   * The instance is mutable so once created it should be used for all future operations.
   */
  public static of<TValue>(value: TValue): InnerStore<TValue> {
    WatchContext.warning(
      "You should not call InnerStore.of(something) inside the useInnerWatch(watcher) callback. " +
        "The useInnerWatch(watcher) hook is for read-only operations but InnerStore.of(something) creates one.",
    )

    return new InnerStore(value)
  }

  private readonly subscribers = new Map<string, VoidFunction>()

  /**
   * A unique key per `InnerStore` instance.
   * This key is used internally for `useInnerWatch`
   * but can be used as the React key property.
   *
   * @see {@link useInnerWatch}
   */
  public readonly key = nanoid()

  private constructor(private value: T) {}

  /**
   * Clones a `InnerStore` instance.
   *
   * @param transform a function that will be applied to the current value before cloning.
   *
   * @returns new `InnerStore` instance with the same value.
   */
  public clone(transform?: (value: T) => T): InnerStore<T> {
    return InnerStore.of(
      typeof transform === "function" ? transform(this.value) : this.value,
    )
  }

  /**
   * An `InnerStore` instance's method that returns the current value.
   */
  public getState(): T
  /**
   * An `InnerStore` instance's method that returns the current value.
   *
   * @param transform a function that will be applied to the current value before returning.
   */
  public getState<R>(transform: (value: T) => R): R
  public getState<R>(transform?: (value: T) => R): T | R {
    WatchContext.register(this)

    return typeof transform === "function" ? transform(this.value) : this.value
  }

  /**
   * Sets the store's value.
   * Each time when the value is changed all of the store's listeners passed via `InnerStore#subscribe` are called.
   * If the new value is comparably equal to the current value neither the value is set nor the listeners are called.
   *
   * @param valueOrTransform either the new value or a function that will be applied to the current value before setting.
   * @param compare a function with strict check (`===`) by default.
   *
   * @returns `void` to emphasize that `InnerStore` instances are mutable.
   *
   * @see {@link InnerStore.subscribe}
   * @see {@link Compare}
   */
  public setState(
    valueOrTransform: SetStateAction<T>,
    compare: Compare<T> = isEqual,
  ): void {
    if (
      WatchContext.warning(
        "You may not call InnerStore#setState(something) inside the useInnerWatch(watcher) callback. " +
          "The useInnerWatch(watcher) hook is for read-only operations but InnerStore#setState(something) changes it.",
      )
    ) {
      return
    }

    const [register, emit] = SetStateContext.init()

    const nextValue =
      typeof valueOrTransform === "function"
        ? (valueOrTransform as (value: T) => T)(this.value)
        : valueOrTransform

    if (!compare(this.value, nextValue)) {
      this.value = nextValue
      register(this.subscribers)
    }

    emit()
  }

  /**
   * subscribes to the store's value changes caused by `InnerStore#setState` calls.
   *
   * @param listener a function that will be called on store updates.
   *
   * @returns a cleanup function that can be used to unsubscribe the listener.
   *
   * @see {@link InnerStore.setState}
   */
  public subscribe(listener: VoidFunction): VoidFunction {
    if (
      WatchContext.warning(
        "You should not call InnerStore#subscribe(listener) inside the useInnerWatch(watcher) callback. " +
          "The useInnerWatch(watcher) hook is for read-only operations but not for creating subscriptions.",
        WatcherPermission.AllowSubscribeOnly,
      )
    ) {
      return noop
    }

    const subscriberId = nanoid()

    this.subscribers.set(subscriberId, listener)

    return () => {
      this.subscribers.delete(subscriberId)
    }
  }
}