import * as React from "react"
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders correctly with given text", () => {
    render(<Button>Click testing</Button>)
    const button = screen.getByRole("button", { name: /click testing/i })
    expect(button).toBeInTheDocument()
  })
})
