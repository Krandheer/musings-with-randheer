// Runs before the page renders so a saved HUD choice doesn't flash the
// default look first.
const hudStorageKey = "hud"
const hudBootMs = 1400

const readHudPref = (): boolean => {
  try {
    return localStorage.getItem(hudStorageKey) === "on"
  } catch {
    return false
  }
}

const isHudOn = () => document.documentElement.getAttribute("data-hud") === "on"

const applyHud = (on: boolean) => {
  if (on) {
    document.documentElement.setAttribute("data-hud", "on")
  } else {
    document.documentElement.removeAttribute("data-hud")
  }
}

// Plays the power-up screen; skipped for people who prefer reduced motion.
const bootHud = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const root = document.documentElement
  root.setAttribute("data-hud-boot", "")
  window.setTimeout(() => root.removeAttribute("data-hud-boot"), hudBootMs)
}

applyHud(readHudPref())

document.addEventListener("nav", () => {
  const toggleHud = () => {
    const on = !isHudOn()
    applyHud(on)
    if (on) bootHud()
    try {
      localStorage.setItem(hudStorageKey, on ? "on" : "off")
    } catch {
      // Private browsing can block storage; the toggle still works per page.
    }
  }

  for (const button of document.getElementsByClassName("hud-toggle")) {
    button.addEventListener("click", toggleHud)
    window.addCleanup(() => button.removeEventListener("click", toggleHud))
  }

  // Status strip readouts: Bengaluru time and how far down the page you are.
  const clock = document.querySelector<HTMLElement>("[data-hud-clock]")
  const progress = document.querySelector<HTMLElement>("[data-hud-progress]")
  if (!clock || !progress) return

  const formatTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  const updateProgress = () => {
    if (!isHudOn()) return
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    const pct = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 100
    progress.textContent = String(Math.min(100, Math.max(0, pct)))
  }
  // Also refreshes progress, so it's right as soon as HUD mode is switched on.
  const tick = () => {
    if (!isHudOn()) return
    clock.textContent = formatTime.format(new Date())
    updateProgress()
  }

  tick()
  const clockTimer = window.setInterval(tick, 1000)
  window.addEventListener("scroll", updateProgress, { passive: true })
  window.addCleanup(() => {
    window.clearInterval(clockTimer)
    window.removeEventListener("scroll", updateProgress)
  })
})
