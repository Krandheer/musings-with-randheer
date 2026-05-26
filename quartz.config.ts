import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "🪴 Musings with Randheer",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "musings.randheer.in",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#faf8f8",
          lightgray: "#e4ecde",
          gray: "#8a8a8a",
          darkgray: "#3d3d3d",
          dark: "#1f1f1f",
          secondary: "#2d5016",
          tertiary: "#4a7c59",
          highlight: "rgba(74, 124, 89, 0.12)",
          textHighlight: "#d4f4dd88",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#2a3a2a",
          gray: "#9aa0a6",
          darkgray: "#e2e2e3",
          dark: "#f5f5f6",
          secondary: "#9bd17c",
          tertiary: "#bcd9b6",
          highlight: "rgba(155, 209, 124, 0.16)",
          textHighlight: "#7fb06955",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem", "git"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({
        enableInHtmlEmbed: false,
        enableVideoEmbed: true, // Enable video embedding
      }),
      Plugin.GitHubFlavoredMarkdown({ linkHeadings: false }),
      Plugin.TableOfContents({
        maxDepth: 4,
        minEntries: 2,
        showByDefault: true,
        collapseByDefault: false,
      }),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest", prettyLinks: true }),
      Plugin.Description({
        descriptionLength: 150,
        replaceExternalLinks: true,
      }),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
        rssLimit: 20,
        rssFullHtml: false,
        includeEmptyFiles: false,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
