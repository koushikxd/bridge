import { authComponent } from "./better-auth/auth"
import { query } from "./_generated/server"
import { getAuthUserRecord } from "./profile_helpers"

export const { getAuthUser } = authComponent.clientApi()

export const getSessionUserState = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx)
    const authUserRecord = await getAuthUserRecord(ctx, authUser._id)

    return {
      authUser,
      hasPersistedAuthRecord: Boolean(authUserRecord),
    }
  },
})
