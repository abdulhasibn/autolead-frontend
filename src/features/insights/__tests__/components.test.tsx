import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it } from "vitest"
import { ChannelTable } from "@/app/(dashboard)/insights/_components/channel-table"
import { CampaignTable } from "@/app/(dashboard)/insights/_components/campaign-table"
import { DemandGapTable } from "@/app/(dashboard)/insights/_components/demand-gap-table"
import {
  sortVehicleRows,
  VehicleSignalTable,
} from "@/app/(dashboard)/insights/_components/vehicle-signal-table"
import demandFixture from "../__fixtures__/demand.json"
import journeyFixture from "../__fixtures__/lead-journey.json"
import noJourneyFixture from "../__fixtures__/lead-journey-none.json"
import trafficFixture from "../__fixtures__/traffic.json"
import detailFixture from "../__fixtures__/vehicle-detail.json"
import vehiclesFixture from "../__fixtures__/vehicles.json"
import { BuyerInterestCard } from "../components/buyer-interest-card"
import { WebsiteJourneyCard } from "../components/website-journey-card"
import type {
  DemandInsights,
  LeadJourney,
  TrafficInsights,
  VehicleInsightDetail,
  VehicleInsights,
} from "../types"

const traffic = trafficFixture as TrafficInsights
const vehicles = vehiclesFixture as VehicleInsights
const detail = detailFixture as VehicleInsightDetail
const demand = demandFixture as DemandInsights

beforeAll(() => {
  // Recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

describe("ChannelTable", () => {
  it("lists channels by visitors with share and lead rate", () => {
    render(<ChannelTable channels={traffic.channels} />)
    const table = screen.getByRole("table")
    const rows = within(table).getAllByRole("row").slice(1)
    expect(within(rows[0]!).getByText("Instagram ads")).toBeInTheDocument()
    expect(within(rows[0]!).getByText("1,820")).toBeInTheDocument()
    expect(within(rows[0]!).getByText("53%")).toBeInTheDocument()
    expect(within(rows[0]!).getByText("2.6%")).toBeInTheDocument()
    expect(within(table).getByText("Google search")).toBeInTheDocument()
  })

  it("shows an empty state with no traffic", () => {
    render(<ChannelTable channels={[]} />)
    expect(screen.getByText("No website visits in this period.")).toBeInTheDocument()
  })
})

describe("CampaignTable", () => {
  it("names ads from campaign and content", () => {
    render(<CampaignTable campaigns={traffic.campaigns} />)
    expect(screen.getByText("Diwali SUVs")).toBeInTheDocument()
    expect(screen.getByText("· Creta reel")).toBeInTheDocument()
    expect(screen.getByText("742")).toBeInTheDocument()
    expect(screen.getByText("Swift story")).toBeInTheDocument()
  })
})

describe("VehicleSignalTable", () => {
  it("shows each car's signal pill with its reason", () => {
    render(<VehicleSignalTable items={vehicles.items} />)
    const table = screen.getByRole("table")
    const creta = within(table).getByRole("link", { name: "2021 Hyundai Creta SX" }).closest("tr")!
    expect(within(creta).getByText("Hot")).toHaveClass("bg-success-muted")
    expect(within(creta).getByText(/Hold firm/)).toBeInTheDocument()
    expect(within(table).getByText("Seen, not enquired")).toBeInTheDocument()
    expect(within(table).getByText("Low visibility")).toBeInTheDocument()
    expect(within(table).getByText("Ageing, cooling")).toBeInTheDocument()
    expect(within(table).getByText("Not enough data")).toBeInTheDocument()
  })

  it("sorts by a column when its header is clicked", async () => {
    const user = userEvent.setup()
    render(<VehicleSignalTable items={vehicles.items} />)
    const table = screen.getByRole("table")
    const firstCar = () => within(within(table).getAllByRole("row")[1]!).getAllByRole("link")[0]!.textContent

    expect(firstCar()).toBe("2021 Hyundai Creta SX")
    await user.click(within(table).getByRole("button", { name: "Days" }))
    expect(firstCar()).toBe("2017 Toyota Innova Crysta 2.4 VX")
    await user.click(within(table).getByRole("button", { name: /Days/ }))
    expect(firstCar()).toBe("2023 Kia Sonet HTX")
  })

  it("sinks unpriced cars to the bottom in either direction", () => {
    const rows = [
      { ...vehicles.items[0]!, vehicleId: "a", listedPrice: null },
      { ...vehicles.items[1]!, vehicleId: "b", listedPrice: 500000 },
    ]
    expect(sortVehicleRows(rows, "listedPrice", "asc").map((r) => r.vehicleId)).toEqual(["b", "a"])
    expect(sortVehicleRows(rows, "listedPrice", "desc").map((r) => r.vehicleId)).toEqual(["b", "a"])
  })
})

describe("DemandGapTable", () => {
  it("marks under- and over-stocked segments", () => {
    render(<DemandGapTable segments={demand.segments} />)
    const suv = screen.getByText("Compact SUV").closest("tr")!
    expect(within(suv).getByText("Under-stocked")).toBeInTheDocument()
    expect(screen.getAllByText("Over-stocked")).toHaveLength(2)
    expect(screen.getAllByText("Balanced")).toHaveLength(2)
  })
})

describe("BuyerInterestCard", () => {
  it("shows the signal, stats and the price change effect", () => {
    render(<BuyerInterestCard insight={detail} />)
    expect(screen.getByText("Seen, not enquired")).toBeInTheDocument()
    expect(screen.getByText("352")).toBeInTheDocument()
    const change = screen.getByRole("list", { name: "Price changes" })
    expect(within(change).getByText("₹9.4L → ₹8.9L")).toBeInTheDocument()
    expect(within(change).getByText(/Views\/day 9 → 14\.5 \(\s*\+61%\)/)).toBeInTheDocument()
    expect(screen.getByText("64%")).toBeInTheDocument()
  })
})

describe("WebsiteJourneyCard", () => {
  it("shows where a website lead came from and what they viewed", () => {
    render(<WebsiteJourneyCard journey={journeyFixture as LeadJourney} />)
    expect(screen.getByText("High intent")).toBeInTheDocument()
    expect(screen.getByText("Instagram ads")).toBeInTheDocument()
    expect(screen.getByText("Diwali SUVs · Creta reel")).toBeInTheDocument()
    expect(screen.getByText("Views of this car").nextSibling).toHaveTextContent("6")
    expect(screen.getByRole("link", { name: "2019 Honda City VX" })).toHaveAttribute(
      "href",
      "/vehicles/7c1e2b8a-3f41-4d2a-9b6e-2a1f0c9d4e02"
    )
  })

  it("renders nothing when the lead has no attribution", () => {
    const { container } = render(<WebsiteJourneyCard journey={noJourneyFixture as LeadJourney} />)
    expect(container).toBeEmptyDOMElement()
  })
})
