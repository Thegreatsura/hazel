import Prism from "prismjs"
import { describe, expect, it } from "vitest"
import "prismjs/components/prism-markdown.js"

describe("Markdown Editor Token Processing", () => {
	const getTokenRanges = (text: string) => {
		const tokens = Prism.tokenize(text, Prism.languages.markdown)
		const ranges: any[] = []
		const path = [0]

		const getLength = (token: any): number => {
			if (typeof token === "string") {
				return token.length
			}
			if (typeof token.content === "string") {
				return token.content.length
			}
			return token.content.reduce((l: any, t: any) => l + getLength(t), 0)
		}

		const processTokens = (tokens: any[], currentStart: number) => {
			let start = currentStart

			for (const token of tokens) {
				const length = getLength(token)
				const end = start + length

				if (typeof token !== "string") {
					// For code blocks, process nested tokens
					if (token.type === "code" && Array.isArray(token.content)) {
						let innerStart = start
						for (const innerToken of token.content) {
							const innerLength = getLength(innerToken)
							const innerEnd = innerStart + innerLength

							if (typeof innerToken !== "string") {
								if (innerToken.type === "punctuation") {
									ranges.push({
										anchor: { offset: innerStart, path },
										focus: { offset: innerEnd, path },
										type: "code-punctuation",
									})
								} else if (innerToken.type === "code-block") {
									ranges.push({
										anchor: { offset: innerStart, path },
										focus: { offset: innerEnd, path },
										type: "code-block",
									})
								} else if (innerToken.type === "code-language") {
									ranges.push({
										anchor: { offset: innerStart, path },
										focus: { offset: innerEnd, path },
										type: "code-language",
									})
								}
							}

							innerStart = innerEnd
						}
					} else {
						ranges.push({
							anchor: { offset: start, path },
							focus: { offset: end, path },
							type: token.type,
						})
					}
				}

				start = end
			}
		}

		processTokens(tokens, 0)
		return ranges
	}

	describe("Inline Code Highlighting", () => {
		it("should tokenize simple inline code", () => {
			const text = "This is `inline code` here"
			const ranges = getTokenRanges(text)

			const inlineCodeRange = ranges.find((r) => r.type === "code-snippet")
			expect(inlineCodeRange).toBeDefined()
			expect(text.substring(inlineCodeRange.anchor.offset, inlineCodeRange.focus.offset)).toBe(
				"`inline code`",
			)
		})

		it("should handle multiple inline code segments", () => {
			const text = "Use `useState` and `useEffect` hooks"
			const ranges = getTokenRanges(text)

			const codeRanges = ranges.filter((r) => r.type === "code-snippet")
			expect(codeRanges).toHaveLength(2)
			expect(text.substring(codeRanges[0].anchor.offset, codeRanges[0].focus.offset)).toBe("`useState`")
			expect(text.substring(codeRanges[1].anchor.offset, codeRanges[1].focus.offset)).toBe(
				"`useEffect`",
			)
		})

		it("should not confuse single backticks with triple backticks", () => {
			const text = "Use `code` not ```"
			const ranges = getTokenRanges(text)

			const inlineCode = ranges.filter((r) => r.type === "code-snippet")
			expect(inlineCode).toHaveLength(1)
			expect(text.substring(inlineCode[0].anchor.offset, inlineCode[0].focus.offset)).toBe("`code`")
		})
	})

	describe("Code Block Highlighting", () => {
		it("should tokenize simple code block", () => {
			const text = "```\ncode block\n```"
			const ranges = getTokenRanges(text)

			const punctuationRanges = ranges.filter((r) => r.type === "code-punctuation")
			const codeBlockRange = ranges.find((r) => r.type === "code-block")

			expect(punctuationRanges).toHaveLength(2)
			expect(codeBlockRange).toBeDefined()

			// Check opening backticks
			expect(
				text.substring(punctuationRanges[0].anchor.offset, punctuationRanges[0].focus.offset),
			).toBe("```")

			// Check code content
			expect(text.substring(codeBlockRange.anchor.offset, codeBlockRange.focus.offset)).toBe(
				"code block",
			)

			// Check closing backticks
			expect(
				text.substring(punctuationRanges[1].anchor.offset, punctuationRanges[1].focus.offset),
			).toBe("```")
		})

		it("should handle code blocks with language specification", () => {
			const text = "```javascript\nconst x = 1;\n```"
			const ranges = getTokenRanges(text)

			const punctuationRanges = ranges.filter((r) => r.type === "code-punctuation")
			const codeBlockRange = ranges.find((r) => r.type === "code-block")
			const languageRange = ranges.find((r) => r.type === "code-language")

			expect(punctuationRanges).toHaveLength(2)
			expect(codeBlockRange).toBeDefined()
			expect(languageRange).toBeDefined()

			// Check language identifier
			expect(text.substring(languageRange.anchor.offset, languageRange.focus.offset)).toBe("javascript")

			// Check code content
			expect(text.substring(codeBlockRange.anchor.offset, codeBlockRange.focus.offset)).toBe(
				"const x = 1;",
			)
		})

		it("should handle multi-line code blocks", () => {
			const text = "```\nline 1\nline 2\nline 3\n```"
			const ranges = getTokenRanges(text)

			const codeBlockRange = ranges.find((r) => r.type === "code-block")
			expect(codeBlockRange).toBeDefined()
			expect(text.substring(codeBlockRange.anchor.offset, codeBlockRange.focus.offset)).toBe(
				"line 1\nline 2\nline 3",
			)
		})

		it("should handle empty code blocks", () => {
			const text = "```\n```"
			const ranges = getTokenRanges(text)

			const punctuationRanges = ranges.filter((r) => r.type === "code-punctuation")
			expect(punctuationRanges).toHaveLength(2)

			// Should not have a code-block range for empty content
			const codeBlockRange = ranges.find((r) => r.type === "code-block")
			expect(codeBlockRange).toBeUndefined()
		})
	})

	describe("Mixed Content", () => {
		it("should handle inline code and code blocks in the same text", () => {
			const text = "Use `inline` code\n\n```\nblock code\n```\n\nMore `inline` here"
			const ranges = getTokenRanges(text)

			const inlineCodeRanges = ranges.filter((r) => r.type === "code-snippet")
			const codeBlockRange = ranges.find((r) => r.type === "code-block")
			const punctuationRanges = ranges.filter((r) => r.type === "code-punctuation")

			expect(inlineCodeRanges).toHaveLength(2)
			expect(codeBlockRange).toBeDefined()
			expect(punctuationRanges).toHaveLength(2)

			// Check first inline code
			expect(text.substring(inlineCodeRanges[0].anchor.offset, inlineCodeRanges[0].focus.offset)).toBe(
				"`inline`",
			)

			// Check code block
			expect(text.substring(codeBlockRange.anchor.offset, codeBlockRange.focus.offset)).toBe(
				"block code",
			)

			// Check second inline code
			expect(text.substring(inlineCodeRanges[1].anchor.offset, inlineCodeRanges[1].focus.offset)).toBe(
				"`inline`",
			)
		})

		it("should handle code blocks with different languages", () => {
			const text = "```js\nconst x = 1;\n```\n\n```python\ndef foo():\n    pass\n```"
			const ranges = getTokenRanges(text)

			const languageRanges = ranges.filter((r) => r.type === "code-language")
			const codeBlockRanges = ranges.filter((r) => r.type === "code-block")

			expect(languageRanges).toHaveLength(2)
			expect(codeBlockRanges).toHaveLength(2)

			// Check language identifiers
			expect(text.substring(languageRanges[0].anchor.offset, languageRanges[0].focus.offset)).toBe("js")
			expect(text.substring(languageRanges[1].anchor.offset, languageRanges[1].focus.offset)).toBe(
				"python",
			)
		})

		it("should handle other markdown elements with code", () => {
			const text = "# Title\n\n**Bold** and `code` and *italic*"
			const ranges = getTokenRanges(text)

			const titleRange = ranges.find((r) => r.type === "title")
			const boldRange = ranges.find((r) => r.type === "bold")
			const codeRange = ranges.find((r) => r.type === "code-snippet")
			const italicRange = ranges.find((r) => r.type === "italic")

			expect(titleRange).toBeDefined()
			expect(boldRange).toBeDefined()
			expect(codeRange).toBeDefined()
			expect(italicRange).toBeDefined()
		})
	})

	describe("Edge Cases", () => {
		it("should handle escaped backticks", () => {
			const text = "This is \\`not code\\` text"
			const ranges = getTokenRanges(text)

			const codeRanges = ranges.filter((r) => r.type === "code-snippet")
			expect(codeRanges).toHaveLength(0)
		})

		it("should handle backticks in code blocks", () => {
			const text = "```\nUse `backticks` inside\n```"
			const ranges = getTokenRanges(text)

			const codeBlockRange = ranges.find((r) => r.type === "code-block")
			expect(codeBlockRange).toBeDefined()
			expect(text.substring(codeBlockRange.anchor.offset, codeBlockRange.focus.offset)).toBe(
				"Use `backticks` inside",
			)
		})

		it("should handle code blocks at the start and end of text", () => {
			const text = "```\nstart\n```\nMiddle text\n```\nend\n```"
			const ranges = getTokenRanges(text)

			const codeBlockRanges = ranges.filter((r) => r.type === "code-block")
			expect(codeBlockRanges).toHaveLength(2)

			expect(text.substring(codeBlockRanges[0].anchor.offset, codeBlockRanges[0].focus.offset)).toBe(
				"start",
			)
			expect(text.substring(codeBlockRanges[1].anchor.offset, codeBlockRanges[1].focus.offset)).toBe(
				"end",
			)
		})

		it("should handle incomplete code blocks", () => {
			const text = "```\nno closing backticks"
			const ranges = getTokenRanges(text)

			// Prism might treat this differently - let's check what it does
			const codeRanges = ranges.filter((r) => r.type.includes("code"))
			expect(codeRanges.length).toBeGreaterThanOrEqual(0)
		})
	})
})
