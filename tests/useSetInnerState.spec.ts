import { useCallback } from "react"
import { act, renderHook } from "@testing-library/react-hooks"

import { InnerStore, SetInnerState, useSetInnerState } from "../src"

import { Counter } from "./helpers"

describe("bypassed store", () => {
  it.concurrent("noop for null", () => {
    const { result } = renderHook(() => useSetInnerState<number>(null))

    expect(() => {
      result.current(1)
    }).not.toThrow()
  })

  it.concurrent("noop for undefined", () => {
    // eslint-disable-next-line no-undefined
    const { result } = renderHook(() => useSetInnerState<number>(undefined))

    expect(() => {
      result.current(1)
    }).not.toThrow()
  })
})

describe("defined store", () => {
  it.concurrent("keeps setState value over time", () => {
    const store = InnerStore.of(0)
    const { result, rerender } = renderHook(() => useSetInnerState(store))

    const setState = result.current

    expect(result.all).toHaveLength(1)

    rerender()
    expect(result.all).toHaveLength(2)
    expect(result.current).toBe(setState)

    expect(store.getState()).toBe(0)
    act(() => {
      setState(1)
    })
    expect(store.getState()).toBe(1)
    expect(result.all).toHaveLength(2)
    expect(result.current).toBe(setState)

    rerender()
    expect(result.all).toHaveLength(3)
    expect(result.current).toBe(setState)
  })

  describe("calls setState(value)", () => {
    let prev = { count: 0 }
    const store = InnerStore.of(prev)
    const spy = jest.fn()
    const unsubscribe = store.subscribe(spy)
    const { result } = renderHook(() => useSetInnerState(store))
    const setState = result.current

    beforeEach(() => {
      prev = store.getState()
      jest.clearAllMocks()
    })

    it("sets new state", () => {
      act(() => {
        setState({ count: 1 })
      })
      const state = store.getState()
      expect(state).not.toBe(prev)
      expect(state).toStrictEqual({ count: 1 })
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it("sets same state", () => {
      act(() => {
        setState({ count: 1 })
      })
      const state = store.getState()
      expect(state).not.toBe(prev)
      expect(state).toStrictEqual({ count: 1 })
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it("sets equal state", () => {
      act(() => {
        setState(prev)
      })
      const state = store.getState()
      expect(state).toBe(prev)
      expect(spy).not.toHaveBeenCalled()
    })

    it("unsubscribes", () => {
      unsubscribe()

      act(() => {
        setState({ count: 3 })
      })
      const state = store.getState()
      expect(state).not.toBe(prev)
      expect(state).toStrictEqual({ count: 3 })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe("calls setState(transform)", () => {
    let prev = { count: 0 }
    const store = InnerStore.of(prev)
    const spy = jest.fn()
    const unsubscribe = store.subscribe(spy)
    const { result } = renderHook(() => useSetInnerState(store))
    const setState = result.current

    beforeEach(() => {
      prev = store.getState()
      jest.clearAllMocks()
    })

    it("sets new state", () => {
      act(() => {
        setState(Counter.inc)
      })
      const state = store.getState()
      expect(state).not.toBe(prev)
      expect(state).toStrictEqual({ count: 1 })
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it("sets same state", () => {
      act(() => {
        setState(Counter.clone)
      })
      const state = store.getState()
      expect(state).not.toBe(prev)
      expect(state).toStrictEqual({ count: 1 })
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it("sets equal state", () => {
      act(() => {
        setState(() => prev)
      })
      const state = store.getState()
      expect(state).toBe(prev)
      expect(spy).not.toHaveBeenCalled()
    })

    it("unsubscribes", () => {
      unsubscribe()

      act(() => {
        setState(Counter.inc)
      })
      const state = store.getState()
      expect(state).not.toBe(prev)
      expect(state).toStrictEqual({ count: 2 })
      expect(spy).not.toHaveBeenCalled()
    })
  })
})

describe("defined store with compare", () => {
  const spyCompare = jest.fn(Counter.compare)

  beforeEach(() => {
    spyCompare.mockClear()
  })

  describe("keeps setState value over time", () => {
    const store_1 = InnerStore.of({ count: 0 })
    const useHook_1 = (): SetInnerState<Counter> => {
      return useSetInnerState(store_1, (left, right) => {
        return spyCompare(left, right)
      })
    }

    const store_2 = InnerStore.of({ count: 0 })
    const useHook_2 = (): SetInnerState<Counter> => {
      return useSetInnerState(
        store_2,
        useCallback((left: Counter, right: Counter) => {
          return spyCompare(left, right)
        }, []),
      )
    }

    it.each([
      ["inline compare", useHook_1, store_1],
      ["memoized compare", useHook_2, store_2],
    ])("%s", (_, init, store) => {
      const { result, rerender } = renderHook(init)
      const setState = result.current

      expect(spyCompare).not.toHaveBeenCalled()
      expect(result.all).toHaveLength(1)
      jest.clearAllMocks()

      rerender()
      expect(store.getState()).toStrictEqual({ count: 0 })
      expect(spyCompare).not.toHaveBeenCalled()
      expect(result.all).toHaveLength(2)
      expect(result.current).toBe(setState)

      act(() => {
        setState(Counter.inc)
      })

      expect(store.getState()).toStrictEqual({ count: 1 })
      expect(spyCompare).toHaveBeenCalledTimes(1)
      expect(result.all).toHaveLength(2)
      expect(result.current).toBe(setState)
      jest.clearAllMocks()

      rerender()
      expect(spyCompare).not.toHaveBeenCalled()
      expect(result.all).toHaveLength(3)
      expect(result.current).toBe(setState)
    })
  })

  describe("changes state", () => {
    const store_1 = InnerStore.of({ count: 0 })
    const useHook_1 = (): SetInnerState<Counter> => {
      return useSetInnerState(store_1, (left, right) => {
        return spyCompare(left, right)
      })
    }

    const store_2 = InnerStore.of({ count: 0 })
    const useHook_2 = (): SetInnerState<Counter> => {
      return useSetInnerState(
        store_2,
        useCallback((left: Counter, right: Counter) => {
          return spyCompare(left, right)
        }, []),
      )
    }

    it.each([
      ["inline compare", useHook_1, store_1],
      ["memoized compare", useHook_2, store_2],
    ])("%s", (_, init, store) => {
      const spy = jest.fn()
      const unsubscribe = store.subscribe(spy)
      const { result } = renderHook(init)
      const setState = result.current

      const prev_1 = store.getState()
      expect(spy).not.toHaveBeenCalled()
      expect(spyCompare).not.toHaveBeenCalled()
      act(() => {
        setState(Counter.inc)
      })
      const state_1 = store.getState()
      expect(state_1).not.toBe(prev_1)
      expect(state_1).toStrictEqual({ count: 1 })
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spyCompare).toHaveBeenCalledTimes(1)
      jest.clearAllMocks()

      const prev_2 = store.getState()
      act(() => {
        setState(Counter.clone)
      })
      const state_2 = store.getState()
      expect(state_2).toBe(prev_2)
      expect(state_2).toStrictEqual({ count: 1 })
      expect(spy).not.toHaveBeenCalled() // does not emit listener
      expect(spyCompare).toHaveBeenCalledTimes(1)
      jest.clearAllMocks()

      unsubscribe()

      const prev_3 = store.getState()
      act(() => {
        setState({ count: 10 })
      })
      const state_3 = store.getState()
      expect(state_3).not.toBe(prev_3)
      expect(state_3).toStrictEqual({ count: 10 })
      expect(spy).not.toHaveBeenCalled()
      expect(spyCompare).toHaveBeenCalledTimes(1)
    })
  })
})
