import { Context, Schema } from "effect"

export const UserId = Schema.String.pipe(Schema.brand("hazel/UserId"))

export class User extends Schema.Class<User>("User")({ userId: UserId }) {}
export class CurrentUser extends Context.Tag("CurrentUser")<CurrentUser, User>() {}
