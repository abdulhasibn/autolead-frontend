import { test as base, expect } from "@playwright/test"

export interface E2EData {
  email: string
  password: string
  userName: string
  leadId: string
  leadName: string
  leadPhone: string
}

function need(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`E2E: ${name} not set (did globalSetup run?)`)
  return v
}

/** Per-run test data created by globalSetup. */
export const test = base.extend<{ e2e: E2EData }>({
  e2e: async ({}, provide) => {
    await provide({
      email: need("E2E_USER_EMAIL"),
      password: need("E2E_USER_PASSWORD"),
      userName: need("E2E_USER_NAME"),
      leadId: need("E2E_LEAD_ID"),
      leadName: need("E2E_LEAD_NAME"),
      leadPhone: need("E2E_LEAD_PHONE"),
    })
  },
})

export { expect }
