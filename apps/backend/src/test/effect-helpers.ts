import { ConfigProvider, Context } from "effect"

export const serviceShape = <T extends Context.Service.Any>(shape: unknown) =>
	shape as Context.Service.Shape<T>

export const configLayer = (values: Record<string, unknown>) =>
	ConfigProvider.layer(ConfigProvider.fromUnknown(values))
