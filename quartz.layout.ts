import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.SkipLink()],
  afterBody: [Component.BackToTop()],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/Krandheer",
      Email: "mailto:gautam.randheer.iitd@gmail.com",
      LinkedIn: "https://linkedin.com/in/randheer-kumar-gautam-804908120/",
      "Digital Garden": "https://github.com/Krandheer/musings-with-randheer",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search({ enablePreview: true }),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer({
      folderClickBehavior: "collapse",
      folderDefaultState: "collapsed",
      useSavedState: true,
      sortFn: (a, b) => {
        if ((!a.file && !b.file) || (a.file && b.file)) {
          return a.displayName.localeCompare(b.displayName)
        }
        return a.file ? 1 : -1
      }
    })),
  ],
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
      }
    }),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.RecentNotes({
      title: "🌱 Recently Growing",
      limit: 5,
      showTags: true,
    }),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search({ enablePreview: true }),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer({
      folderClickBehavior: "collapse",
      folderDefaultState: "collapsed",
      useSavedState: true,
    })),
  ],
  right: [],
}
