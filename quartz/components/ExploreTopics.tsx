import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FullSlug, resolveRelative } from "../util/path"

interface Options {
  title: string
  // Tags to leave out, e.g. ones already featured elsewhere on the page.
  exclude: string[]
}

const defaultOptions: Options = {
  title: "Explore topics",
  exclude: [],
}

export default ((userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const ExploreTopics: QuartzComponent = ({
    allFiles,
    fileData,
    displayClass,
  }: QuartzComponentProps) => {
    const counts = new Map<string, number>()
    for (const file of allFiles) {
      for (const tag of file.frontmatter?.tags ?? []) {
        if (!opts.exclude.includes(tag)) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1)
        }
      }
    }
    const tags = [...counts].sort(([a, na], [b, nb]) => nb - na || a.localeCompare(b))

    return (
      <nav class={classNames(displayClass, "explore-topics")} aria-label={opts.title}>
        <h3>{opts.title}</h3>
        <ul>
          {tags.map(([tag, count]) => (
            <li>
              <a class="internal" href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}>
                {tag}
                <span class="explore-topics-count">{count}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  return ExploreTopics
}) satisfies QuartzComponentConstructor<Partial<Options>>
