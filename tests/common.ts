import { Compare, Sweety } from "../src"

export abstract class Counter {
  public abstract readonly count: number

  public static compare: Compare<Counter> = (prev, next) => {
    return prev.count === next.count
  }

  public static merge(left: Counter, right: Counter, ...rest: Array<Counter>) {
    return {
      count: [left, right, ...rest]
        .map(Counter.getCount)
        .reduce((acc, x) => acc + x, 0),
    }
  }

  public static clone(counter: Counter): Counter {
    return { ...counter }
  }

  public static getCount(counter: Counter): number {
    return counter.count
  }

  public static inc({ count }: Counter): Counter {
    return { count: count + 1 }
  }
}

export interface WithStore<T = Counter> {
  store: Sweety<T>
}

export interface WithCompare<T = Counter> {
  compare?: null | Compare<T>
}

export interface WithFirst<T = Counter> {
  first: Sweety<T>
}

export interface WithSecond<T = Counter> {
  second: Sweety<T>
}

export interface WithThird<T = Counter> {
  third: Sweety<T>
}

export interface WithSpy {
  spy: VoidFunction
}

export interface WithListener {
  listener: VoidFunction
}

export interface WithIsActive {
  isActive: boolean
}
