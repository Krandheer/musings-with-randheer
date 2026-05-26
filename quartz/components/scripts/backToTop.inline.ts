document.addEventListener("nav", () => {
  const progressBar = document.getElementById("scroll-progress")
  const backToTop = document.getElementById("back-to-top")
  if (!progressBar || !backToTop) return

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  let ticking = false

  const update = () => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
    progressBar.style.width = `${progress}%`
    backToTop.classList.toggle("visible", scrollTop > 400)
    ticking = false
  }

  const onScroll = () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(update)
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true })
  update()

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "instant" : "smooth",
    })
  })
})
