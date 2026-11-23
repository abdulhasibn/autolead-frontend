/**
 * Thin client over the backend REST API for seeding test data quickly
 * (UI-driven creation is only used where the UI itself is under test).
 * Every name/registration carries the run prefix so cleanup can find it.
 */
import { randomInt } from "node:crypto"

export const SHOWROOM_ID = "b0000000-0000-4000-8000-000000000001"

const apiUrl = () => (process.env.API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "")

export interface ApiResponse<T = any> {
  status: number
  body: T
  headers: Headers
}

export class Api {
  constructor(
    public token?: string,
    /** Kept so a worker-long session can sign in again when its token stops working. */
    private readonly credentials?: { email: string; password: string }
  ) {}

  static async login(email: string, password: string): Promise<Api> {
    const res = await new Api().call<{ accessToken: string }>("POST", "/auth/login", {
      email,
      password,
    })
    if (res.status !== 200) throw new Error(`E2E login ${email}: ${res.status} ${JSON.stringify(res.body)}`)
    return new Api(res.body.accessToken, { email, password })
  }

  /**
   * One retry on 401 for a logged-in client: a single token lives for a whole
   * worker, and a run can outlast it (or lose it to a provider hiccup). The
   * retry signs in again; a second 401 is returned as is.
   */
  async call<T = any>(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    const first = await this.send<T>(method, path, body, headers)
    // Only a rejected token is retried. Other 401s (e.g. a wrong finance key)
    // must not be resent: a second wrong key counts towards the vault lockout.
    const tokenRejected = (first.body as any)?.error?.code === "AUTHENTICATION_FAILED"
    if (first.status !== 401 || !tokenRejected || !this.credentials || path === "/auth/login") return first
    const login = await new Api().send<{ accessToken: string }>("POST", "/auth/login", this.credentials)
    if (login.status !== 200) return first
    this.token = login.body.accessToken
    return this.send<T>(method, path, body, headers)
  }

  private async send<T = any>(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    const res = await fetch(`${apiUrl()}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    let parsed: unknown = text
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      /* non-JSON body */
    }
    return { status: res.status, body: parsed as T, headers: res.headers }
  }

  async ok<T = any>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    const res = await this.call<T>(method, path, body, headers)
    if (res.status >= 300) {
      throw new Error(`E2E ${method} ${path} -> ${res.status} ${JSON.stringify(res.body)}`)
    }
    return res.body
  }

  // ---------- catalog ----------
  private catalogCache?: Catalog
  async catalog(): Promise<Catalog> {
    if (this.catalogCache) return this.catalogCache
    const makes = (await this.ok<{ items: { id: string; name: string }[] }>("GET", "/catalog/makes?limit=100")).items
    for (const make of makes) {
      const models = (await this.ok<{ items: { id: string; name: string }[] }>(
        "GET",
        `/catalog/makes/${make.id}/models?limit=100`
      )).items
      for (const model of models) {
        const variants = (await this.ok<{ items: { id: string; name: string }[] }>(
          "GET",
          `/catalog/models/${model.id}/variants?limit=100`
        )).items
        const variant = variants[0]
        if (variant) {
          const found: Catalog = { make, model, variant }
          this.catalogCache = found
          return found
        }
      }
    }
    throw new Error("E2E: catalog has no make/model/variant")
  }

  // ---------- seed helpers ----------
  async createOwner(prefix: string, over: Record<string, unknown> = {}): Promise<Owner> {
    return this.ok<Owner>("POST", "/owners", {
      fullName: `Owner ${prefix} ${randomInt(1000, 9999)}`,
      phone: randomPhone(),
      city: "Bengaluru",
      ...over,
    })
  }

  async createVehicle(prefix: string, over: Record<string, unknown> = {}): Promise<Vehicle> {
    const cat = await this.catalog()
    const ownerId = (over.ownerId as string) ?? (await this.createOwner(prefix)).id
    return this.ok<Vehicle>("POST", "/vehicles", {
      showroomId: SHOWROOM_ID,
      ownerId,
      variantId: cat.variant.id,
      year: 2019,
      registrationNumber: randomPlate(),
      fuelType: "petrol",
      transmission: "manual",
      kmDriven: 42000,
      numPreviousOwners: 1,
      colour: "White",
      accidentHistory: false,
      location: `E2E ${prefix}`,
      acquisitionType: "consignment",
      ...over,
    })
  }

  async createLead(prefix: string, over: Record<string, unknown> = {}): Promise<Lead> {
    const body = {
      fullName: `Lead ${prefix} ${randomInt(1000, 9999)}`,
      phone: randomPhone(),
      source: "phone",
      budget: 800000,
      ...over,
    }
    // The API returns the contact as contactFullName / contactPhone.
    const lead = await this.ok<Omit<Lead, "fullName" | "phone"> & { contactFullName: string; contactPhone: string }>(
      "POST",
      "/leads",
      body
    )
    return { ...lead, fullName: lead.contactFullName, phone: lead.contactPhone }
  }

  setStatus(leadId: string, status: string, notes?: string) {
    return this.call("POST", `/leads/${leadId}/status`, { status, notes })
  }

  setVehicleStatus(vehicleId: string, status: string, reason: string | null = null, confirmUnlinkLeads = false) {
    return this.call("POST", `/vehicles/${vehicleId}/status`, { status, reason, confirmUnlinkLeads })
  }

  scheduleFollowUp(leadId: string, dueAt: Date, over: Record<string, unknown> = {}) {
    return this.ok<{ id: string }>("POST", `/leads/${leadId}/follow-ups`, {
      scheduledAt: dueAt.toISOString(),
      taskType: "call",
      ...over,
    })
  }

  /** Convert a lead (books first) on a linked car. */
  async convert(leadId: string) {
    await this.ok("POST", `/leads/${leadId}/status`, { status: "booking_confirmed" })
    return this.ok("POST", `/leads/${leadId}/status`, { status: "converted" })
  }
}

export interface Catalog {
  make: { id: string; name: string }
  model: { id: string; name: string }
  variant: { id: string; name: string }
}
export interface Owner { id: string; fullName: string; phone: string }
export interface Vehicle { id: string; registrationNumber: string; status: string; ownerId: string }
export interface Lead { id: string; contactId: string; fullName: string; phone: string; status: string }

/** Indian mobile in the 9xxxx test range, E.164. */
export function randomPhone(): string {
  return `+9199${String(randomInt(0, 100_000_000)).padStart(8, "0")}`
}

/** Unique plate shaped like KA01AB1234 (E2 series reserved for tests). */
export function randomPlate(): string {
  const letters = "ABCDEFGHJKLMNPRSTUVWXYZ"
  const l = () => letters[randomInt(0, letters.length)]
  return `KA${String(randomInt(1, 99)).padStart(2, "0")}E${l()}${String(randomInt(0, 10000)).padStart(4, "0")}`
}
