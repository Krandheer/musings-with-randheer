import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { QuartzPluginData } from "./quartz/plugins/vfile"

// Folder index pages (and the home page) are navigation, not notes, so keep
// them out of "recent notes" style lists.
const isNote = (f: QuartzPluginData) => !f.slug?.endsWith("index")

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
        filter: isNote,
      }),
      condition: (page) => page.fileData.slug === "index",
    }),
    // Giscus comments, stored as GitHub Discussions on the garden's repo.
    // Only on notes: not the home page, folder pages, or tag pages.
    Component.ConditionalRender({
      component: Component.Comments({
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
      }),
      condition: (page) => isNote(page.fileData) && !page.fileData.slug?.startsWith("tags/"),
    }),
    Component.BackToTop(),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/Krandheer",
      Email: "mailto:gautam.randheer.iitd@gmail.com",
      LinkedIn: "https://linkedin.com/in/randheer-kumar-gautam-804908120/",
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
      { Component: Component.ReaderMode() },
    ],
  }),
  Component.Explorer({
    folderClickBehavior: "collapse",
    folderDefaultState: "collapsed",
    useSavedState: true,
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
    Component.Graph({
      localGraph: {
        drag: true,
        zoom: true,
        depth: 2,
        scale: 1.1,
        repelForce: 0.5,
        centerForce: 0.3,
        linkDistance: 30,
        fontSize: 0.6,
        opacityScale: 1,
        showTags: true,
        removeTags: [],
        focusOnHover: false,
      },
      globalGraph: {
        drag: true,
        zoom: true,
        depth: -1,
        scale: 0.9,
        repelForce: 0.5,
        centerForce: 0.3,
        linkDistance: 30,
        fontSize: 0.6,
        opacityScale: 1,
        showTags: true,
        removeTags: [],
        focusOnHover: true,
      },
    }),
    Component.DesktopOnly(Component.TableOfContents()),
    // The home page already lists latest notes in its body.
    Component.ConditionalRender({
      component: Component.RecentNotes({
        title: "🌱 Recently Growing",
        limit: 5,
        showTags: true,
        filter: isNote,
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
