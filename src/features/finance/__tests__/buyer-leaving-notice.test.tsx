import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getBuyerMoneyAction = vi.fn()
vi.mock("../actions", () => ({ getBuyerMoneyAction: (...a: unknown[]) => getBuyerMoneyAction(...a) }))

import { BuyerLeavingNotice } from "../components/buyer-leaving-notice"

const MONEY = { buyers: [{ leadId: "a", net: 50000 }, { leadId: "b", net: 20000 }], total: 70000 }

beforeEach(() => vi.clearAllMocks())

describe("buyer leaving warning", () => {
  it("warns with the lead's own amount and the Dues hint", async () => {
    getBuyerMoneyAction.mockResolvedValue({ ok: true, data: MONEY })
    render(<BuyerLeavingNotice vehicleId="v1" leadId="a" active />)
    expect(await screen.findByTestId("buyer-leaving-warning")).toHaveTextContent(
      "₹50,000 was received from this buyer. It will show in Dues as a refund owed."
    )
  })

  it("without a lead (Drop car) adds up every buyer", async () => {
    getBuyerMoneyAction.mockResolvedValue({ ok: true, data: MONEY })
    render(<BuyerLeavingNotice vehicleId="v1" active />)
    expect(await screen.findByTestId("buyer-leaving-warning")).toHaveTextContent("₹70,000 was received from buyers on this car")
  })

  it("shows nothing when finance is locked (the lookup answers null) and never blocks", async () => {
    getBuyerMoneyAction.mockResolvedValue({ ok: true, data: null })
    render(<BuyerLeavingNotice vehicleId="v1" leadId="a" active />)
    await waitFor(() => expect(getBuyerMoneyAction).toHaveBeenCalled())
    expect(screen.queryByTestId("buyer-leaving-warning")).toBeNull()
  })

  it("shows nothing when that lead paid nothing", async () => {
    getBuyerMoneyAction.mockResolvedValue({ ok: true, data: MONEY })
    render(<BuyerLeavingNotice vehicleId="v1" leadId="zzz" active />)
    await waitFor(() => expect(getBuyerMoneyAction).toHaveBeenCalled())
    expect(screen.queryByTestId("buyer-leaving-warning")).toBeNull()
  })

  it("does not look anything up until the change is under way", () => {
    render(<BuyerLeavingNotice vehicleId="v1" leadId="a" active={false} />)
    expect(getBuyerMoneyAction).not.toHaveBeenCalled()
  })
})
