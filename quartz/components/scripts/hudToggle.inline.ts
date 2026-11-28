// Runs before the page renders so a saved HUD choice doesn't flash the
// wrong look first. HUD mode is the default; the classic design is opt-in.
const hudStorageKey = "hud"
const hudBootMs = 1400
const hudShutdownMs = 550
const hudGlyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/<>"

const readHudPref = (): boolean => {
  try {
    return localStorage.getItem(hudStorageKey) !== "off"
  } catch {
    return true
  }
}

// The visitor's own light/dark choice, for when they switch to the classic design.
const savedLightDarkTheme = (): "light" | "dark" => {
  let stored: string | null = null
  try {
    stored = localStorage.getItem("theme")
  } catch {
    // Fall through to the system preference.
  }
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

const saveHudPref = (on: boolean) => {
  try {
    localStorage.setItem(hudStorageKey, on ? "on" : "off")
  } catch {
    // Private browsing can block storage; the toggle still works per page.
  }
}

const isHudOn = () => document.documentElement.getAttribute("data-hud") === "on"
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

// HUD is a dark visor, so it runs on Quartz's dark theme underneath (code
// highlighting, comments); the classic design gets the visitor's own theme
// back. Only the attribute changes, never the visitor's saved theme.
const applyHud = (on: boolean, announce = false) => {
  const root = document.documentElement
  if (on) {
    root.setAttribute("data-hud", "on")
  } else {
    root.removeAttribute("data-hud")
  }
  const theme = on ? "dark" : savedLightDarkTheme()
  if (root.getAttribute("saved-theme") !== theme) {
    root.setAttribute("saved-theme", theme)
    if (announce) {
      document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }))
    }
  }
  for (const button of document.getElementsByClassName("hud-toggle")) {
    button.setAttribute("aria-pressed", String(on))
    button.setAttribute("title", on ? "Switch to the classic design" : "Switch to HUD mode")
  }
}

// Power-up screen when HUD mode is switched on.
const bootHud = () => {
  const root = document.documentElement
  root.setAttribute("data-hud-boot", "")
  window.setTimeout(() => root.removeAttribute("data-hud-boot"), hudBootMs)
}

// CRT-style collapse when it's switched off, centred on what's on screen.
const shutdownHud = (done: () => void) => {
  const root = document.documentElement
  root.style.setProperty("--hud-crt-y", `${window.scrollY + window.innerHeight / 2}px`)
  root.setAttribute("data-hud-shutdown", "")
  window.setTimeout(() => {
    root.removeAttribute("data-hud-shutdown")
    done()
  }, hudShutdownMs)
}

// Scrambles an element's text through random glyphs, resolving left to right.
// Screen readers get the real text via aria-label while it runs.
const decodeText = (el: HTMLElement) => {
  const original = el.textContent ?? ""
  if (!original.trim()) return () => {}
  el.setAttribute("aria-label", original)
  let frame = 0
  const totalFrames = 18
  const timer = window.setInterval(() => {
    frame++
    const revealed = Math.floor((frame / totalFrames) * original.length)
    el.textContent = [...original]
      .map((ch, i) =>
        i < revealed || ch === " " ? ch : hudGlyphs[Math.floor(Math.random() * hudGlyphs.length)],
      )
      .join("")
    if (frame >= totalFrames) stop()
  }, 35)
  const stop = () => {
    window.clearInterval(timer)
    el.textContent = original
    el.removeAttribute("aria-label")
  }
  return stop
}

const decodeTitles = () => {
  if (!isHudOn() || prefersReducedMotion()) return []
  return [...document.querySelectorAll<HTMLElement>(".article-title, .hero h1")].map(decodeText)
}

applyHud(readHudPref())

document.addEventListener("nav", () => {
  // Sync the toggle's pressed state and label with the current mode.
  applyHud(isHudOn())
  let busy = false
  let stopDecodes = decodeTitles()

  const toggleHud = () => {
    if (busy) return
    const on = !isHudOn()
    saveHudPref(on)
    if (prefersReducedMotion()) {
      applyHud(on, true)
      return
    }
    if (on) {
      applyHud(true, true)
      bootHud()
      window.setTimeout(() => (stopDecodes = decodeTitles()), hudBootMs - 400)
    } else {
      busy = true
      shutdownHud(() => {
        applyHud(false, true)
        busy = false
      })
    }
  }

  for (const button of document.getElementsByClassName("hud-toggle")) {
    button.addEventListener("click", toggleHud)
    window.addCleanup(() => button.removeEventListener("click", toggleHud))
  }
  window.addCleanup(() => stopDecodes.forEach((stop) => stop()))

  // Status strip readouts: Bengaluru time, current section, reading progress.
  const clock = document.querySelector<HTMLElement>("[data-hud-clock]")
  const progress = document.querySelector<HTMLElement>("[data-hud-progress]")
  const section = document.querySelector<HTMLElement>("[data-hud-section]")
  if (!clock || !progress || !section) return

  const sectionHeadings = [...document.querySelectorAll<HTMLElement>("article > h2[id]")]
  const formatTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const updateReadouts = () => {
    if (!isHudOn()) return
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    const pct = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 100
    progress.textContent = String(Math.min(100, Math.max(0, pct)))

    // The last section heading that has scrolled past the top of the screen.
    let current = -1
    sectionHeadings.forEach((h, i) => {
      if (h.getBoundingClientRect().top < 140) current = i
    })
    section.textContent =
      current < 0
        ? sectionHeadings.length > 0
          ? "Intro"
          : "Standby"
        : `${String(current + 1).padStart(2, "0")} · ${sectionHeadings[current].textContent?.trim()}`
  }

  // Also refreshes the readouts, so they're right as soon as HUD mode is on.
  const tick = () => {
    if (!isHudOn()) return
    clock.textContent = formatTime.format(new Date())
    updateReadouts()
  }

  tick()
  const clockTimer = window.setInterval(tick, 1000)
  window.addEventListener("scroll", updateReadouts, { passive: true })
  window.addCleanup(() => {
    window.clearInterval(clockTimer)
    window.removeEventListener("scroll", updateReadouts)
  })

  // Target reticle: trails the mouse, and locks on to brackets round whatever
  // link, button or card is under it. Mouse/trackpad only.
  const reticle = document.querySelector<HTMLElement>(".hud-reticle")
  if (!reticle || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return

  const reticleSize = 30
  const lockPadding = 6
  let pointerX = 0
  let pointerY = 0
  let locked: Element | null = null

  const placeReticle = () => {
    if (locked) {
      const r = locked.getBoundingClientRect()
      reticle.style.transform = `translate(${r.left - lockPadding}px, ${r.top - lockPadding}px)`
      reticle.style.width = `${r.width + lockPadding * 2}px`
      reticle.style.height = `${r.height + lockPadding * 2}px`
    } else {
      reticle.style.transform = `translate(${pointerX - reticleSize / 2}px, ${pointerY - reticleSize / 2}px)`
      reticle.style.width = `${reticleSize}px`
      reticle.style.height = `${reticleSize}px`
    }
  }

  const onPointerMove = (e: MouseEvent) => {
    if (!isHudOn() || prefersReducedMotion()) return
    pointerX = e.clientX
    pointerY = e.clientY
    const target = (e.target as Element | null)?.closest(
      "a, button, input, .topic-card, .result-card",
    )
    // Don't lock on to anything nearly as wide as the screen.
    locked =
      target && target.getBoundingClientRect().width < window.innerWidth * 0.6 ? target : null
    reticle.classList.toggle("hud-reticle-locked", locked !== null)
    reticle.classList.add("hud-reticle-active")
    placeReticle()
  }
  const onPointerLeave = () => reticle.classList.remove("hud-reticle-active")
  const onScrollReticle = () => {
    if (locked) placeReticle()
  }

  document.addEventListener("mousemove", onPointerMove, { passive: true })
  document.documentElement.addEventListener("mouseleave", onPointerLeave)
  window.addEventListener("scroll", onScrollReticle, { passive: true })
  window.addCleanup(() => {
    document.removeEventListener("mousemove", onPointerMove)
    document.documentElement.removeEventListener("mouseleave", onPointerLeave)
    window.removeEventListener("scroll", onScrollReticle)
  })
})
