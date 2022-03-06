/**
 * A function that compares two values and returns `true` if they are equal.
 * Depending on the type of the values it might be more efficient to use
 * a custom compare function such as shallow-equal or deep-equal.
 *
 * @public
 */
export type Compare<T> = (prev: T, next: T) => boolean

/**
 * @private
 */
export const isEqual = <T>(one: T, another: T): boolean => one === another

export const overrideCompare = <T>(
  original: Compare<T>,
  override: undefined | null | Compare<T>,
): Compare<T> => {
  if (override === null) {
    return isEqual
  }

  return override ?? original
}

/**
 * @private
 */
export const noop: VoidFunction = () => {
  // do nothing
}

/**
 * @private
 */
export const warning = (message: string): void => {
  /* eslint-disable no-console */
  if (
    process.env.NODE_ENV !== "production" &&
    typeof console !== "undefined" &&
    typeof console.error === "function"
  ) {
    console.error(message)
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message)
  } catch {
    // do nothing
  }
}

/**
 * @private
 */
export const modInc = (x: number): number => {
  return (x + 1) % 123456789
}
