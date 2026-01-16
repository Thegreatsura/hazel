/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

// Global constants injected by Vite
declare const __APP_VERSION__: string

// Vite environment variables
interface ImportMetaEnv {
	readonly VITE_BACKEND_URL: string
	readonly VITE_SIGNOZ_INGESTION_KEY?: string
	readonly VITE_OTEL_ENVIRONMENT?: string
	readonly VITE_COMMIT_SHA?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
