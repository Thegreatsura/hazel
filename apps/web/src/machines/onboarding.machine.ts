import type { OrganizationId } from "@hazel/schema"
import type { Exit } from "effect"
import { assign, fromPromise, setup } from "xstate"

// Context type
export interface OnboardingContext {
	orgId?: OrganizationId
	createdOrgId?: OrganizationId
	orgSlug?: string
	useCases: string[]
	role?: string
	organization?: {
		id: OrganizationId
		name?: string
		slug?: string
	}
	error?: string
	firstName?: string
	lastName?: string
	theme?: "dark" | "light" | "system"
	brandColor?: string
}

// Event types
export type OnboardingEvent =
	| { type: "CONTINUE" }
	| { type: "BACK" }
	| { type: "WELCOME_CONTINUE" }
	| {
			type: "PROFILE_INFO_CONTINUE"
			data: { firstName: string; lastName: string }
	  }
	| {
			type: "THEME_CONTINUE"
			data: { theme: "dark" | "light" | "system"; brandColor: string }
	  }
	| {
			type: "ORG_SETUP_CONTINUE"
			data: { name: string; slug: string; organizationId: OrganizationId }
	  }
	| {
			type: "USE_CASE_CONTINUE"
			data: { useCases: string[] }
	  }
	| {
			type: "ROLE_CONTINUE"
			data: { role: string }
	  }
	| {
			type: "INVITE_TEAM_CONTINUE"
			data: { emails: string[] }
	  }
	| { type: "INVITE_TEAM_SKIP" }
	| { type: "ORG_CREATED"; data: { orgId: OrganizationId } }
	| { type: "COMPLETION_SUCCESS"; data: { slug: string } }
	| { type: "COMPLETION_ERROR"; error: string }
	| { type: "RETRY" }

// Input type (initial context from props)
export interface OnboardingInput {
	orgId?: OrganizationId
	organization?: {
		id: OrganizationId
		name?: string
		slug?: string
	}
}

// Service types
export interface OnboardingServices {
	createOrganization: (data: {
		name: string
		slug: string
	}) => Promise<Exit.Exit<{ data: { id: OrganizationId } }, unknown>>
	setOrganizationSlug: (data: { id: OrganizationId; slug: string }) => Promise<Exit.Exit<unknown, unknown>>
	completeOnboarding: (data: {
		orgId: OrganizationId
		role: string
		useCases: string[]
		emails: string[]
	}) => Promise<{ slug: string }>
}

export const onboardingMachine = setup({
	types: {
		context: {} as OnboardingContext,
		events: {} as OnboardingEvent,
		input: {} as OnboardingInput,
	},
	actors: {
		handleOrgSetup: fromPromise(
			async (_: {
				input: { orgId?: OrganizationId; createdOrgId?: OrganizationId; name: string; slug: string }
			}) => {
				return {} as { orgId: OrganizationId }
			},
		),
		handleCompletion: fromPromise(
			async (_: {
				input: {
					orgId?: OrganizationId
					role: string
					useCases: string[]
					emails: string[]
					orgSlug?: string
					organizationSlug?: string
				}
			}) => {
				return {} as { slug: string }
			},
		),
	},
	guards: {
		isCreator: ({ context }) => {
			return !context.orgId || !context.organization?.slug
		},
		isInvited: ({ context }) => {
			return Boolean(context.orgId && context.organization?.slug)
		},
	},
	actions: {
		navigateToOrg: () => {
			// This action will be provided by the component with navigation logic
		},
		setOrgData: assign({
			orgSlug: ({ event }) => {
				if (event.type === "ORG_SETUP_CONTINUE") {
					return event.data.slug
				}
				return undefined
			},
		}),
		setCreatedOrgId: assign({
			createdOrgId: ({ event }) => {
				if (event.type === "ORG_CREATED") {
					return event.data.orgId
				}
				return undefined
			},
		}),
		setProfileInfo: assign({
			firstName: ({ event }) => {
				if (event.type === "PROFILE_INFO_CONTINUE") {
					return event.data.firstName
				}
				return undefined
			},
			lastName: ({ event }) => {
				if (event.type === "PROFILE_INFO_CONTINUE") {
					return event.data.lastName
				}
				return undefined
			},
		}),
		setThemePreferences: assign({
			theme: ({ event }) => {
				if (event.type === "THEME_CONTINUE") {
					return event.data.theme
				}
				return undefined
			},
			brandColor: ({ event }) => {
				if (event.type === "THEME_CONTINUE") {
					return event.data.brandColor
				}
				return undefined
			},
		}),
		setUseCases: assign({
			useCases: ({ event }) => {
				if (event.type === "USE_CASE_CONTINUE") {
					return event.data.useCases
				}
				return []
			},
		}),
		setRole: assign({
			role: ({ event }) => {
				if (event.type === "ROLE_CONTINUE") {
					return event.data.role
				}
				return undefined
			},
		}),
		setError: assign({
			error: ({ event }) => {
				if (event.type === "COMPLETION_ERROR") {
					return event.error
				}
				return undefined
			},
		}),
		clearError: assign({
			error: undefined,
		}),
		setCompletionSlug: assign({
			orgSlug: ({ context, event }) => {
				// Handle invoke done event - extract slug from output
				if (
					"output" in event &&
					event.output &&
					typeof event.output === "object" &&
					"slug" in event.output
				) {
					return event.output.slug as string
				}
				// Preserve existing orgSlug as fallback
				return context.orgSlug
			},
		}),
	},
}).createMachine({
	id: "onboarding",
	context: ({ input }) => ({
		orgId: input.orgId,
		organization: input.organization,
		useCases: [],
		createdOrgId: undefined,
		orgSlug: undefined,
		role: undefined,
		error: undefined,
	}),
	initial: "welcome",
	states: {
		welcome: {
			meta: {
				stepNumber: { creator: 1, invited: 1 },
			},
			on: {
				WELCOME_CONTINUE: "profileInfo",
			},
		},
		profileInfo: {
			meta: {
				stepNumber: { creator: 2, invited: 2 },
			},
			on: {
				BACK: "welcome",
				PROFILE_INFO_CONTINUE: {
					target: "themeSelection",
					actions: "setProfileInfo",
				},
			},
		},
		themeSelection: {
			meta: {
				stepNumber: { creator: 3, invited: 3 },
			},
			on: {
				BACK: "profileInfo",
				THEME_CONTINUE: [
					{
						target: "organizationSetup",
						guard: "isCreator",
						actions: "setThemePreferences",
					},
					{
						target: "profileSetup.role",
						guard: "isInvited",
						actions: "setThemePreferences",
					},
				],
			},
		},
		organizationSetup: {
			initial: "form",
			meta: {
				stepNumber: { creator: 4, invited: null },
			},
			states: {
				form: {
					on: {
						BACK: "#onboarding.themeSelection",
						ORG_SETUP_CONTINUE: {
							target: "processing",
							actions: "setOrgData",
						},
					},
				},
				processing: {
					tags: ["loading"],
					entry: "clearError",
					invoke: {
						id: "handleOrgSetup",
						src: "handleOrgSetup",
						input: ({ context, event }) => {
							if (event.type !== "ORG_SETUP_CONTINUE") {
								throw new Error("Invalid event type")
							}
							return {
								orgId: context.orgId,
								createdOrgId:
									context.createdOrgId || (event.data.organizationId as OrganizationId),
								name: event.data.name,
								slug: event.data.slug,
							}
						},
						onDone: {
							target: "#onboarding.profileSetup",
							actions: assign({
								createdOrgId: ({ event }) => event.output.orgId,
								orgSlug: ({ context }) => context.orgSlug,
							}),
						},
						onError: {
							target: "form",
							actions: assign({
								error: ({ event }) => {
									const error = event.error as Error
									return error.message || "Failed to set up organization"
								},
							}),
						},
					},
				},
			},
		},
		profileSetup: {
			initial: "useCases",
			meta: {
				stepNumber: { creator: 5, invited: 4 },
			},
			states: {
				useCases: {
					meta: {
						stepNumber: { creator: 5, invited: null },
					},
					on: {
						BACK: [
							{
								target: "#onboarding.organizationSetup.form",
								guard: "isCreator",
							},
							{
								target: "#onboarding.themeSelection",
								guard: "isInvited",
							},
						],
						USE_CASE_CONTINUE: {
							target: "role",
							actions: "setUseCases",
						},
					},
				},
				role: {
					meta: {
						stepNumber: { creator: 6, invited: 4 },
					},
					on: {
						BACK: [
							{
								target: "useCases",
								guard: "isCreator",
							},
							{
								target: "#onboarding.themeSelection",
								guard: "isInvited",
							},
						],
						ROLE_CONTINUE: [
							{
								target: "#onboarding.teamInvitation",
								guard: "isCreator",
								actions: "setRole",
							},
							{
								target: "#onboarding.finalization",
								guard: "isInvited",
								actions: "setRole",
							},
						],
					},
				},
			},
		},
		teamInvitation: {
			initial: "inviteForm",
			meta: {
				stepNumber: { creator: 7, invited: null },
			},
			states: {
				inviteForm: {
					meta: {
						stepNumber: { creator: 7, invited: null },
					},
					on: {
						BACK: "#onboarding.profileSetup.role",
						INVITE_TEAM_CONTINUE: "#onboarding.finalization",
						INVITE_TEAM_SKIP: "#onboarding.finalization",
					},
				},
			},
		},
		finalization: {
			initial: "processing",
			meta: {
				stepNumber: { creator: 7, invited: 4 },
			},
			states: {
				processing: {
					meta: {
						stepNumber: { creator: 7, invited: 4 },
					},
					tags: ["loading"],
					entry: "clearError",
					invoke: {
						id: "handleCompletion",
						src: "handleCompletion",
						input: ({ context, event }) => {
							const emails = event.type === "INVITE_TEAM_CONTINUE" ? event.data.emails : []
							return {
								orgId: context.orgId || context.createdOrgId,
								role: context.role!,
								useCases: context.useCases,
								emails,
								orgSlug: context.orgSlug,
								organizationSlug: context.organization?.slug,
							}
						},
						onDone: {
							target: "#onboarding.completed",
							actions: "setCompletionSlug",
						},
						onError: {
							target: "#onboarding.profileSetup.role",
							actions: assign({
								error: ({ event }) => {
									const error = event.error as Error
									return error.message || "Failed to complete onboarding"
								},
							}),
						},
					},
				},
			},
		},
		completed: {
			type: "final",
			entry: "navigateToOrg",
		},
	},
})
