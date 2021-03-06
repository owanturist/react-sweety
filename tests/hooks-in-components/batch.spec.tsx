import React from "react"
import { act, render, screen, fireEvent } from "@testing-library/react"

import {
  batch,
  Sweety,
  useGetSweetyState,
  useSetSweetyState,
  useSweetyState,
  useWatchSweety,
} from "../../src"
import { Counter } from "../common"

describe.each([
  ["not batched", (cb: VoidFunction) => cb()],
  ["batched", batch],
])("multiple stores %s calls with direct store access", (_, execute) => {
  it("re-renders once for Sweety#setState calls", () => {
    const onRender = vi.fn()
    const store_1 = Sweety.of({ count: 1 })
    const store_2 = Sweety.of({ count: 2 })

    const Component: React.FC = () => {
      const counter_1 = useGetSweetyState(store_1)
      const counter_2 = useGetSweetyState(store_2)

      return (
        <React.Profiler id="test" onRender={onRender}>
          <span data-testid="count">{counter_1.count + counter_2.count}</span>
        </React.Profiler>
      )
    }

    render(<Component />)

    expect(screen.getByTestId("count")).toHaveTextContent("3")
    expect(onRender).toHaveBeenCalledTimes(1)

    act(() => {
      execute(() => {
        store_1.setState(Counter.inc)
        store_2.setState(Counter.inc)
      })
    })
    expect(screen.getByTestId("count")).toHaveTextContent("5")
    expect(onRender).toHaveBeenCalledTimes(2)
  })

  it("re-renders once for useSweetyState calls", () => {
    const onRender = vi.fn()
    const store_1 = Sweety.of({ count: 1 })
    const store_2 = Sweety.of({ count: 2 })

    const Component: React.FC = () => {
      const [counter_1, setCounter_1] = useSweetyState(store_1)
      const [counter_2, setCounter_2] = useSweetyState(store_2)

      return (
        <React.Profiler id="test" onRender={onRender}>
          <button
            type="button"
            data-testid="inc"
            onClick={() => {
              execute(() => {
                setCounter_1(Counter.inc)
                setCounter_2(Counter.inc)
              })
            }}
          />
          <span data-testid="count">{counter_1.count + counter_2.count}</span>
        </React.Profiler>
      )
    }

    render(<Component />)

    expect(screen.getByTestId("count")).toHaveTextContent("3")
    expect(onRender).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId("inc"))
    expect(screen.getByTestId("count")).toHaveTextContent("5")
    expect(onRender).toHaveBeenCalledTimes(2)
  })
})

describe.each([
  ["not batched", (cb: VoidFunction) => cb()],
  ["batched", batch],
])("nested stores %s calls with direct store access", (_, execute) => {
  it("re-renders once for Sweety#setState calls", () => {
    const onRender = vi.fn()
    const store = Sweety.of({
      first: Sweety.of({ count: 1 }),
      second: Sweety.of({ count: 2 }),
    })

    const Component: React.FC = () => {
      const { first: store_1, second: store_2 } = useGetSweetyState(store)
      const counter_1 = useGetSweetyState(store_1)
      const counter_2 = useGetSweetyState(store_2)

      return (
        <React.Profiler id="test" onRender={onRender}>
          <span data-testid="count">{counter_1.count + counter_2.count}</span>
        </React.Profiler>
      )
    }

    render(<Component />)

    expect(screen.getByTestId("count")).toHaveTextContent("3")
    expect(onRender).toHaveBeenCalledTimes(1)

    act(() => {
      execute(() => {
        store.setState((state) => {
          state.first.setState(Counter.inc)
          state.second.setState(Counter.inc)

          return state
        })
      })
    })
    expect(screen.getByTestId("count")).toHaveTextContent("5")
    expect(onRender).toHaveBeenCalledTimes(2)

    act(() => {
      store.setState((state) => {
        execute(() => {
          state.first.setState(Counter.inc)
          state.second.setState(Counter.inc)
        })

        return state
      })
    })
    expect(screen.getByTestId("count")).toHaveTextContent("7")
    expect(onRender).toHaveBeenCalledTimes(3)
  })

  it("re-renders once for useSweetyState calls", () => {
    const onRender = vi.fn()
    const store = Sweety.of({
      first: Sweety.of({ count: 1 }),
      second: Sweety.of({ count: 2 }),
    })

    const Component: React.FC = () => {
      const [{ first: store_1, second: store_2 }, setState] =
        useSweetyState(store)
      const counter_1 = useGetSweetyState(store_1)
      const counter_2 = useGetSweetyState(store_2)

      return (
        <React.Profiler id="test" onRender={onRender}>
          <button
            type="button"
            data-testid="inc-1"
            onClick={() => {
              execute(() => {
                setState((state) => {
                  state.first.setState(Counter.inc)
                  state.second.setState(Counter.inc)

                  return state
                })
              })
            }}
          />
          <button
            type="button"
            data-testid="inc-2"
            onClick={() => {
              setState((state) => {
                execute(() => {
                  state.first.setState(Counter.inc)
                  state.second.setState(Counter.inc)
                })

                return state
              })
            }}
          />
          <span data-testid="count">{counter_1.count + counter_2.count}</span>
        </React.Profiler>
      )
    }

    render(<Component />)

    expect(screen.getByTestId("count")).toHaveTextContent("3")
    expect(onRender).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId("inc-1"))
    expect(screen.getByTestId("count")).toHaveTextContent("5")
    expect(onRender).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByTestId("inc-2"))
    expect(screen.getByTestId("count")).toHaveTextContent("7")
    expect(onRender).toHaveBeenCalledTimes(3)
  })
})

describe.each([
  {
    name: "no batching for inline watcher",
    expectedWatcherCallsForMultiple: 4,
    expectedWatcherCallsForNested: 3,
    execute: (cb: VoidFunction) => cb(),
    useCount: (watcher: () => number) => {
      return useWatchSweety(() => watcher())
    },
  },
  {
    name: "with batching for inline watcher",
    expectedWatcherCallsForMultiple: 3,
    expectedWatcherCallsForNested: 3,
    execute: batch,
    useCount: (watcher: () => number) => {
      return useWatchSweety(() => watcher())
    },
  },
  {
    name: "no batching for memoized watcher",
    expectedWatcherCallsForMultiple: 2,
    expectedWatcherCallsForNested: 1,
    execute: (cb: VoidFunction) => cb(),
    useCount: (watcher: () => number) => {
      return useWatchSweety(React.useCallback(() => watcher(), [watcher]))
    },
  },
  {
    name: "with batching for memoized watcher",
    expectedWatcherCallsForMultiple: 1,
    expectedWatcherCallsForNested: 1,
    execute: batch,
    useCount: (watcher: () => number) => {
      return useWatchSweety(React.useCallback(() => watcher(), [watcher]))
    },
  },
])(
  "when $name",
  ({
    expectedWatcherCallsForMultiple,
    expectedWatcherCallsForNested,
    execute,
    useCount,
  }) => {
    describe("for multiple stores", () => {
      const setup = () => {
        const spy = vi.fn()
        const onRender = vi.fn()
        const first = Sweety.of({ count: 1 })
        const second = Sweety.of({ count: 2 })
        const watcher = () => {
          spy()

          return (
            first.getState(Counter.getCount) + second.getState(Counter.getCount)
          )
        }

        return { spy, onRender, first, second, watcher }
      }

      it(`calls the watcher ${expectedWatcherCallsForMultiple} times by Sweety#setState calls`, () => {
        const { spy, onRender, first, second, watcher } = setup()

        const Component: React.FC = () => {
          const count = useCount(watcher)

          return (
            <React.Profiler id="test" onRender={onRender}>
              <span data-testid="count">{count}</span>
            </React.Profiler>
          )
        }

        render(<Component />)

        expect(screen.getByTestId("count")).toHaveTextContent("3")
        expect(onRender).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledTimes(2)
        spy.mockReset()

        act(() => {
          execute(() => {
            first.setState(Counter.inc)
            second.setState(Counter.inc)
          })
        })
        expect(screen.getByTestId("count")).toHaveTextContent("5")
        expect(onRender).toHaveBeenCalledTimes(2)
        expect(spy).toHaveBeenCalledTimes(expectedWatcherCallsForMultiple)
      })

      it(`calls the watcher ${expectedWatcherCallsForMultiple} times by useSetSweetyState calls`, () => {
        const { spy, onRender, first, second, watcher } = setup()

        const Component: React.FC = () => {
          const count = useCount(watcher)
          const setFirst = useSetSweetyState(first)
          const setSecond = useSetSweetyState(second)

          return (
            <React.Profiler id="test" onRender={onRender}>
              <button
                type="button"
                data-testid="inc"
                onClick={() => {
                  execute(() => {
                    setFirst(Counter.inc)
                    setSecond(Counter.inc)
                  })
                }}
              />
              <span data-testid="count">{count}</span>
            </React.Profiler>
          )
        }

        render(<Component />)

        expect(screen.getByTestId("count")).toHaveTextContent("3")
        expect(onRender).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledTimes(2)
        spy.mockReset()

        fireEvent.click(screen.getByTestId("inc"))
        expect(screen.getByTestId("count")).toHaveTextContent("5")
        expect(onRender).toHaveBeenCalledTimes(2)
        expect(spy).toHaveBeenCalledTimes(expectedWatcherCallsForMultiple)
      })
    })

    describe("for nested stores", () => {
      const setup = () => {
        const spy = vi.fn()
        const onRender = vi.fn()
        const store = Sweety.of({
          first: Sweety.of({ count: 1 }),
          second: Sweety.of({ count: 2 }),
        })
        const watcher = () => {
          spy()

          return store.getState(
            ({ first, second }) =>
              first.getState(Counter.getCount) +
              second.getState(Counter.getCount),
          )
        }

        return { spy, onRender, store, watcher }
      }

      it(`calls the watcher ${expectedWatcherCallsForNested} times by Sweety#setState calls`, () => {
        const { spy, onRender, store, watcher } = setup()

        const Component: React.FC = () => {
          const count = useCount(watcher)

          return (
            <React.Profiler id="test" onRender={onRender}>
              <span data-testid="count">{count}</span>
            </React.Profiler>
          )
        }

        render(<Component />)

        expect(screen.getByTestId("count")).toHaveTextContent("3")
        expect(onRender).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledTimes(2)
        spy.mockReset()

        act(() => {
          execute(() => {
            store.setState((state) => {
              state.first.setState(Counter.inc)
              state.second.setState(Counter.inc)

              return state
            })
          })
        })
        expect(screen.getByTestId("count")).toHaveTextContent("5")
        expect(onRender).toHaveBeenCalledTimes(2)
        expect(spy).toHaveBeenCalledTimes(expectedWatcherCallsForNested)
        spy.mockReset()

        act(() => {
          store.setState((state) => {
            execute(() => {
              state.first.setState(Counter.inc)
              state.second.setState(Counter.inc)
            })

            return state
          })
        })
        expect(screen.getByTestId("count")).toHaveTextContent("7")
        expect(onRender).toHaveBeenCalledTimes(3)
        expect(spy).toHaveBeenCalledTimes(expectedWatcherCallsForNested)
      })

      it(`calls the watcher ${expectedWatcherCallsForNested} times by useSetSweetyState calls`, () => {
        const { spy, onRender, store, watcher } = setup()

        const Component: React.FC = () => {
          const count = useCount(watcher)
          const setState = useSetSweetyState(store)

          return (
            <React.Profiler id="test" onRender={onRender}>
              <button
                type="button"
                data-testid="inc-1"
                onClick={() => {
                  execute(() => {
                    setState((state) => {
                      state.first.setState(Counter.inc)
                      state.second.setState(Counter.inc)

                      return state
                    })
                  })
                }}
              />
              <button
                type="button"
                data-testid="inc-2"
                onClick={() => {
                  setState((state) => {
                    execute(() => {
                      state.first.setState(Counter.inc)
                      state.second.setState(Counter.inc)
                    })

                    return state
                  })
                }}
              />
              <span data-testid="count">{count}</span>
            </React.Profiler>
          )
        }

        render(<Component />)

        expect(screen.getByTestId("count")).toHaveTextContent("3")
        expect(onRender).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledTimes(2)
        spy.mockReset()

        fireEvent.click(screen.getByTestId("inc-1"))
        expect(screen.getByTestId("count")).toHaveTextContent("5")
        expect(onRender).toHaveBeenCalledTimes(2)
        expect(spy).toHaveBeenCalledTimes(expectedWatcherCallsForNested)
        spy.mockReset()

        fireEvent.click(screen.getByTestId("inc-2"))
        expect(screen.getByTestId("count")).toHaveTextContent("7")
        expect(onRender).toHaveBeenCalledTimes(3)
        expect(spy).toHaveBeenCalledTimes(expectedWatcherCallsForNested)
      })
    })
  },
)
