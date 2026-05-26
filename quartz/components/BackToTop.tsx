// @ts-ignore
import backToTopScript from "./scripts/backToTop.inline"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const BackToTop: QuartzComponent = () => {
  return (
    <>
      <div class="scroll-progress" id="scroll-progress" aria-hidden="true" />
      <button type="button" class="back-to-top" id="back-to-top" aria-label="Back to top">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </button>
    </>
  )
}

BackToTop.afterDOMLoaded = backToTopScript

export default (() => BackToTop) satisfies QuartzComponentConstructor
