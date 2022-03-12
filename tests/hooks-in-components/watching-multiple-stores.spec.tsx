import React from "react"
import { act, render, screen, fireEvent } from "@testing-library/react"

import { InnerStore, useInnerWatch } from "../../src"

import { CounterComponent, withinNth } from "./common"

describe("watching multiple stores", () => {
  interface AppProps {
    firstCount: InnerStore<number>
    secondCount: InnerStore<number>
    onRender: VoidFunction
    onFirstCounterRender: VoidFunction
    onSecondCounterRender: VoidFunction
  }

  const GenericApp: React.VFC<
    {
      moreThanOne: boolean
      lessThanFour: boolean
    } & AppProps
  > = ({
    moreThanOne,
    lessThanFour,
    firstCount,
    secondCount,
    onRender,
    onFirstCounterRender,
    onSecondCounterRender,
  }) => {
    onRender()

    return (
      <>
        {moreThanOne && <span>more than two</span>}
        {lessThanFour && <span>less than seven</span>}

        <button
          type="button"
          data-testid="increment-both"
          onClick={() => {
            firstCount.setState((state) => state + 1)
            secondCount.setState((state) => state + 1)
          }}
        />

        <CounterComponent count={firstCount} onRender={onFirstCounterRender} />
        <CounterComponent
          count={secondCount}
          onRender={onSecondCounterRender}
        />
      </>
    )
  }

  const SingleWatcherApp: React.VFC<AppProps> = (props) => {
    const [moreThanOne, lessThanFour] = useInnerWatch(
      () => {
        const sum = props.firstCount.getState() + props.secondCount.getState()

        return [sum > 2, sum < 7]
      },
      ([left1, right1], [left2, right2]) => {
        return left1 === left2 && right1 === right2
      },
    )

    return (
      <GenericApp
        moreThanOne={moreThanOne}
        lessThanFour={lessThanFour}
        {...props}
      />
    )
  }

  const SingleMemoizedWatcherApp: React.VFC<AppProps> = (props) => {
    const [moreThanOne, lessThanFour] = useInnerWatch(
      React.useCallback(() => {
        const sum = props.firstCount.getState() + props.secondCount.getState()

        return [sum > 2, sum < 7]
      }, [props.firstCount, props.secondCount]),
      React.useCallback(([left1, right1], [left2, right2]) => {
        return left1 === left2 && right1 === right2
      }, []),
    )

    return (
      <GenericApp
        moreThanOne={moreThanOne}
        lessThanFour={lessThanFour}
        {...props}
      />
    )
  }

  const MultipleWatchersApp: React.VFC<AppProps> = (props) => {
    const moreThanOne = useInnerWatch(() => {
      const sum = props.firstCount.getState() + props.secondCount.getState()

      return sum > 2
    })
    const lessThanFour = useInnerWatch(() => {
      const sum = props.firstCount.getState() + props.secondCount.getState()

      return sum < 7
    })

    return (
      <GenericApp
        moreThanOne={moreThanOne}
        lessThanFour={lessThanFour}
        {...props}
      />
    )
  }

  const MultipleMemoizedWatchersApp: React.VFC<AppProps> = (props) => {
    const moreThanOne = useInnerWatch(
      React.useCallback(() => {
        const sum = props.firstCount.getState() + props.secondCount.getState()

        return sum > 2
      }, [props.firstCount, props.secondCount]),
    )
    const lessThanFour = useInnerWatch(
      React.useCallback(() => {
        const sum = props.firstCount.getState() + props.secondCount.getState()

        return sum < 7
      }, [props.firstCount, props.secondCount]),
    )

    return (
      <GenericApp
        moreThanOne={moreThanOne}
        lessThanFour={lessThanFour}
        {...props}
      />
    )
  }

  it.each([
    ["single watcher", SingleWatcherApp],
    ["single memoized watcher", SingleMemoizedWatcherApp],
    ["multiple watchers", MultipleWatchersApp],
    ["multiple memoized watchers", MultipleMemoizedWatchersApp],
  ])("watches multiple stores with %s", (_, App) => {
    const firstCount = InnerStore.of(0)
    const secondCount = InnerStore.of(0)
    const onFirstCountRender = jest.fn()
    const onSecondCountRender = jest.fn()
    const onRender = jest.fn()

    render(
      <App
        firstCount={firstCount}
        secondCount={secondCount}
        onFirstCounterRender={onFirstCountRender}
        onSecondCounterRender={onSecondCountRender}
        onRender={onRender}
      />,
    )

    // initial render and watcher setup
    expect(onRender).toHaveBeenCalledTimes(1)
    expect(onFirstCountRender).toHaveBeenCalledTimes(1)
    expect(onSecondCountRender).toHaveBeenCalledTimes(1)
    expect(screen.queryByText("more than two")).not.toBeInTheDocument()
    expect(screen.queryByText("less than seven")).toBeInTheDocument()
    expect(screen.getAllByTestId("count")[0]).toHaveTextContent("0")
    expect(screen.getAllByTestId("count")[1]).toHaveTextContent("0")

    // increment first count
    fireEvent.click(withinNth("counter", 0).getByTestId("increment"))
    expect(onRender).toHaveBeenCalledTimes(1) // does not re-render
    expect(onFirstCountRender).toHaveBeenCalledTimes(2)
    expect(onSecondCountRender).toHaveBeenCalledTimes(1)
    expect(screen.queryByText("more than two")).not.toBeInTheDocument()
    expect(screen.queryByText("less than seven")).toBeInTheDocument()
    expect(screen.getAllByTestId("count")[0]).toHaveTextContent("1")
    expect(screen.getAllByTestId("count")[1]).toHaveTextContent("0")

    // increment second count
    fireEvent.click(withinNth("counter", 1).getByTestId("increment"))
    expect(onRender).toHaveBeenCalledTimes(1) // does not re-render
    expect(onFirstCountRender).toHaveBeenCalledTimes(2)
    expect(onSecondCountRender).toHaveBeenCalledTimes(2)
    expect(screen.queryByText("more than two")).not.toBeInTheDocument()
    expect(screen.queryByText("less than seven")).toBeInTheDocument()
    expect(screen.getAllByTestId("count")[0]).toHaveTextContent("1")
    expect(screen.getAllByTestId("count")[1]).toHaveTextContent("1")

    // increment both
    fireEvent.click(screen.getByTestId("increment-both"))
    expect(onRender).toHaveBeenCalledTimes(2)
    expect(onFirstCountRender).toHaveBeenCalledTimes(3)
    expect(onSecondCountRender).toHaveBeenCalledTimes(3)
    expect(screen.queryByText("more than two")).toBeInTheDocument()
    expect(screen.queryByText("less than seven")).toBeInTheDocument()
    expect(screen.getAllByTestId("count")[0]).toHaveTextContent("2")
    expect(screen.getAllByTestId("count")[1]).toHaveTextContent("2")

    // increment both again
    fireEvent.click(screen.getByTestId("increment-both"))
    expect(onRender).toHaveBeenCalledTimes(2) // does not re-render
    expect(onFirstCountRender).toHaveBeenCalledTimes(4)
    expect(onSecondCountRender).toHaveBeenCalledTimes(4)
    expect(screen.queryByText("more than two")).toBeInTheDocument()
    expect(screen.queryByText("less than seven")).toBeInTheDocument()
    expect(screen.getAllByTestId("count")[0]).toHaveTextContent("3")
    expect(screen.getAllByTestId("count")[1]).toHaveTextContent("3")

    // increment first
    fireEvent.click(withinNth("counter", 0).getByTestId("increment"))
    expect(onRender).toHaveBeenCalledTimes(3)
    expect(onFirstCountRender).toHaveBeenCalledTimes(5)
    expect(onSecondCountRender).toHaveBeenCalledTimes(4)
    expect(screen.queryByText("more than two")).toBeInTheDocument()
    expect(screen.queryByText("less than seven")).not.toBeInTheDocument()
    expect(screen.getAllByTestId("count")[0]).toHaveTextContent("4")
    expect(screen.getAllByTestId("count")[1]).toHaveTextContent("3")

    // increment both from the outside
    act(() => {
      firstCount.setState((state) => state + 1)
      secondCount.setState((state) => state + 1)
    })
    expect(onRender).toHaveBeenCalledTimes(3) // does not re-render
    expect(onFirstCountRender).toHaveBeenCalledTimes(6)
    expect(onSecondCountRender).toHaveBeenCalledTimes(5)
    expect(screen.queryByText("more than two")).toBeInTheDocument()
    expect(screen.queryByText("less than seven")).not.toBeInTheDocument()
    expect(screen.getAllByTestId("count")[0]).toHaveTextContent("5")
    expect(screen.getAllByTestId("count")[1]).toHaveTextContent("4")
  })
})