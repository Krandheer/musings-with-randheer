import { QuartzComponent, QuartzComponentConstructor } from "./types"

interface Options {
  url: string
}

export default ((opts: Options) => {
  const Newsletter: QuartzComponent = () => {
    return (
      <aside class="newsletter" aria-label="Newsletter">
        <div>
          <p class="newsletter-title">📬 Weekly newsletter</p>
          <p class="newsletter-text">
            I share my learning on investment, philosophy, and life in general. Free, straight to
            your inbox.
          </p>
        </div>
        {/* /subscribe shows Substack's paid "pledge" plans; /embed is the free signup form. */}
        <a class="newsletter-button" href={`${opts.url}/embed`}>
          Subscribe free
        </a>
      </aside>
    )
  }

  return Newsletter
}) satisfies QuartzComponentConstructor<Options>
