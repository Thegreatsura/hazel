import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import localesPlugin from "@react-aria/optimize-locales-plugin"
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import tanstackRouter from "@tanstack/router-plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// Generate build timestamp once and reuse it everywhere
const BUILD_TIME = Date.now()
const APP_VERSION = process.env.npm_package_version || "1.0.0"

/**
 * Plugin to generate version.json file during build
 * Used for detecting when new app versions are available
 */
function versionPlugin(): Plugin {
	return {
		name: "version-plugin",
		buildStart() {
			const version = {
				buildTime: BUILD_TIME,
				version: APP_VERSION,
			}

			// Write to public directory so it's served at /version.json
			const publicDir = resolve(__dirname, "public")
			writeFileSync(`${publicDir}/version.json`, JSON.stringify(version, null, 2))
		},
	}
}

export default defineConfig({
	plugins: [
		devtools(),
		tanstackRouter({ target: "react", autoCodeSplitting: false, routeToken: "layout" }),

		{
			...localesPlugin.vite({
				locales: ["en-US"],
			}),
			enforce: "pre",
		},

		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		tailwindcss(),
		versionPlugin(),
		VitePWA({
			registerType: "prompt",
			includeAssets: ["icon.svg", "favicon.ico"],
			manifest: {
				name: "Hazel Chat",
				short_name: "Hazel",
				description: "Slack alternative for modern teams.",
				theme_color: "#000000",
				background_color: "#ffffff",
				display: "standalone",
				start_url: "/",
				icons: [
					{
						src: "pwa-64x64.png",
						sizes: "64x64",
						type: "image/png",
					},
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "maskable-icon-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
				globIgnores: ["**/images/onboarding/**"],
				maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
			},
		}),
	],

	define: {
		__BUILD_TIME__: BUILD_TIME,
		__APP_VERSION__: JSON.stringify(APP_VERSION),
	},

	resolve: {
		alias: {
			"~": resolve(__dirname, "./src"),
		},
	},
})
