import { QuartzComponent, QuartzComponentConstructor } from "./types"

const SkipLink: QuartzComponent = () => {
  return (
    <a href="#quartz-body" class="skip-link">
      Skip to content
    </a>
  )
}

export default (() => SkipLink) satisfies QuartzComponentConstructor
