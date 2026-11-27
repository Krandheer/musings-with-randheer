import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { QuartzPluginData } from "./quartz/plugins/vfile"

// Folder index pages (and the home page) are navigation, not notes, and the
// 404 page isn't content; keep them out of note lists, comments, etc.
const isNote = (f: QuartzPluginData) => !f.slug?.endsWith("index") && f.slug !== "404"

// Book chapters are reached from the book's contents page; listing 23 of them
// as "recent" would crowd out the garden's notes.
const isRecentNote = (f: QuartzPluginData) => isNote(f) && !f.slug?.startsWith("book/")

const SUBSTACK_URL = "https://randheer1.substack.com"

// Giscus comments, stored as GitHub Discussions on the garden's repo.
const comments = Component.Comments({
  provider: "giscus",
  options: {
    repo: "Krandheer/musings-with-randheer",
    repoId: "R_kgDOMqdqmA",
    category: "Announcements",
    categoryId: "DIC_kwDOMqdqmM4DMHhA",
    mapping: "pathname",
    reactionsEnabled: true,
    inputPosition: "top",
  },
})

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.SkipLink()],
  afterBody: [
    Component.ConditionalRender({
      component: Component.RecentNotes({
        title: "🌱 Latest notes",
        limit: 6,
        showTags: true,
        filter: isRecentNote,
      }),
      condition: (page) => page.fileData.slug === "index",
    }),
    Component.ConditionalRender({
      component: Component.Newsletter({ url: SUBSTACK_URL }),
      condition: (page) =>
        isNote(page.fileData) ||
        page.fileData.slug === "index" ||
        page.fileData.slug === "book/reflections-on-life-growth-and-wisdom/index",
    }),
    // Only on notes: not the home page, folder pages, or tag pages.
    Component.ConditionalRender({
      component: comments,
      condition: (page) => isNote(page.fileData) && !page.fileData.slug?.startsWith("tags/"),
    }),
    Component.BackToTop(),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/Krandheer",
      Email: "mailto:gautam.randheer.iitd@gmail.com",
      LinkedIn: "https://linkedin.com/in/randheer-kumar-gautam-804908120/",
      Newsletter: SUBSTACK_URL,
      RSS: "https://musings.randheer.in/index.xml",
    },
  }),
}

const leftSidebar = [
  Component.PageTitle(),
  Component.MobileOnly(Component.Spacer()),
  Component.Flex({
    components: [
      {
        Component: Component.Search(),
        grow: true,
      },
      { Component: Component.Darkmode() },
      { Component: Component.HudToggle() },
      { Component: Component.ReaderMode() },
    ],
  }),
  Component.Explorer({
    folderClickBehavior: "collapse",
    folderDefaultState: "collapsed",
    useSavedState: true,
    sortFn: (a, b) => {
      // Book chapters are named "NN-…" so they sort in reading order.
      if (/^\d+-/.test(a.slugSegment) && /^\d+-/.test(b.slugSegment)) {
        return a.slugSegment.localeCompare(b.slugSegment)
      }
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1
      }
      return a.displayName.localeCompare(b.displayName, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    },
  }),
]

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: leftSidebar,
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
    // The home page has no TOC, so offer a way in by topic instead. The book
    // is already featured in the page body.
    Component.ConditionalRender({
      component: Component.ExploreTopics({ title: "🧭 Explore topics", exclude: ["book"] }),
      condition: (page) => page.fileData.slug === "index",
    }),
    // The home page already lists latest notes in its body.
    Component.ConditionalRender({
      component: Component.RecentNotes({
        title: "🌱 Recently Growing",
        limit: 5,
        showTags: true,
        filter: isRecentNote,
      }),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: leftSidebar,
  right: [],
}
