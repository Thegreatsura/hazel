import { Schema } from "effect"
import * as Model from "../services/model"

export const baseFields = {
	createdAt: Model.Generated(Schema.DateFromString),
	updatedAt: Model.Generated(Schema.NullOr(Schema.DateFromString)),
	deletedAt: Model.GeneratedByApp(Schema.NullOr(Schema.DateFromString)),
}
