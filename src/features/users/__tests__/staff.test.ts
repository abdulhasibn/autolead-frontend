import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "@/lib/api-error"
import { createUserSchema, editUserSchema } from "../schemas"

const ADMIN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const OTHER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"

const session = { user: { id: ADMIN_ID, roles: ["admin"] as string[] } }
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => session) }))
vi.mock("../api", () => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  updateUserRoles: vi.fn(),
}))

const api = await import("../api")
const { createUserAction, deactivateUserAction, updateUserAction } = await import("../actions")

const DETAILS = {
  fullName: " Priya Nair ",
  phone: "98765 43210",
  email: "priya@example.com",
  showroomId: "",
}

describe("staff schemas (#20)", () => {
  it("normalises a new account for the API", () => {
    expect(
      createUserSchema.parse({ ...DETAILS, password: "secret12", roles: ["salesperson"] })
    ).toEqual({
      fullName: "Priya Nair",
      phone: "+919876543210",
      email: "priya@example.com",
      showroomId: null,
      password: "secret12",
      roles: ["salesperson"],
    })
  })

  it("needs a role, a valid email and an 8-character password", () => {
    const result = createUserSchema.safeParse({
      ...DETAILS,
      email: "nope",
      password: "short",
      roles: [],
    })
    expect(result.error?.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["email", "password", "roles"])
    )
  })
})

describe("staff actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session.user.roles = ["admin"]
  })

  it("is admin-only", async () => {
    session.user.roles = ["salesperson"]
    const result = await createUserAction({ ...DETAILS, password: "secret12", roles: ["salesperson"] })
    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } })
    expect(api.createUser).not.toHaveBeenCalled()
  })

  it("saves details and only calls the roles endpoint when roles changed", async () => {
    vi.mocked(api.getUser).mockResolvedValue({
      id: OTHER_ID,
      fullName: "Priya",
      phone: "+919876543210",
      email: "priya@example.com",
      showroomId: null,
      roles: ["salesperson"],
      createdAt: "2026-11-01T00:00:00.000Z",
    })
    const edit = editUserSchema.parse({ ...DETAILS, roles: ["salesperson"] })

    await updateUserAction(OTHER_ID, edit)
    expect(api.updateUser).toHaveBeenCalledOnce()
    expect(api.updateUserRoles).not.toHaveBeenCalled()

    await updateUserAction(OTHER_ID, { ...edit, roles: ["salesperson", "admin"] })
    expect(api.updateUserRoles).toHaveBeenCalledWith(OTHER_ID, ["salesperson", "admin"])
  })

  it("says the details were saved when only the roles change fails", async () => {
    vi.mocked(api.getUser).mockResolvedValue({
      id: OTHER_ID,
      fullName: "Priya",
      phone: "+919876543210",
      email: null,
      showroomId: null,
      roles: ["admin"],
      createdAt: "2026-11-01T00:00:00.000Z",
    })
    vi.mocked(api.updateUserRoles).mockRejectedValue(
      new ApiError(409, "LAST_ADMIN_PROTECTED", "Would remove the last admin")
    )

    const result = await updateUserAction(OTHER_ID, editUserSchema.parse({ ...DETAILS, roles: ["salesperson"] }))

    expect(result).toMatchObject({ ok: false, error: { code: "LAST_ADMIN_PROTECTED" } })
    expect(!result.ok && result.error.message).toMatch(/^Details saved/)
  })

  it("never deactivates the signed-in admin", async () => {
    const result = await deactivateUserAction(ADMIN_ID)
    expect(result).toMatchObject({ ok: false, error: { code: "LAST_ADMIN_PROTECTED" } })
    expect(api.deleteUser).not.toHaveBeenCalled()

    await expect(deactivateUserAction(OTHER_ID)).resolves.toMatchObject({ ok: true })
    expect(api.deleteUser).toHaveBeenCalledWith(OTHER_ID)
  })
})
