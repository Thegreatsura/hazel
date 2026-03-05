import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
	site: "https://hazel.sh",
	integrations: [react(), sitemap()],
	redirects: {
		"/download": "/desktop",
	},
	vite: {
		plugins: [tailwindcss()],
	},
})
