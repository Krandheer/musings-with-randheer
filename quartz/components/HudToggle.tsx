// @ts-ignore
import hudScript from "./scripts/hudToggle.inline"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

// "HUD mode" theme switch (on by default; the classic design is opt-in). The button also carries the HUD's
// screen overlay (status strip, frame corners, scan line, target reticle,
// boot screen), which stays hidden unless HUD mode is on. The look lives in
// styles/hud.scss.
const HudToggle: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <>
      <button
        type="button"
        class={classNames(displayClass, "hud-toggle")}
        aria-label="HUD mode"
        aria-pressed="true"
        title="Switch to the classic design"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      </button>
      <div class="hud-overlay" aria-hidden="true">
        <div class="hud-status">
          <span>
            <span class="hud-status-dot" />
            Systems online
          </span>
          <span class="hud-status-section">
            ▸ <span data-hud-section>Standby</span>
          </span>
          <span>
            BLR <span data-hud-clock>--:--:--</span>
            <span class="hud-status-sep">/</span>
            Read <span data-hud-progress>0</span>%
          </span>
        </div>
        <span class="hud-corner hud-corner-tl" />
        <span class="hud-corner hud-corner-tr" />
        <span class="hud-corner hud-corner-bl" />
        <span class="hud-corner hud-corner-br" />
        <div class="hud-scan" />
      </div>
      <div class="hud-reticle" aria-hidden="true" />
      <div class="hud-boot" aria-hidden="true">
        <div class="hud-boot-sweep" />
        <p class="hud-boot-text">
          Initializing HUD
          <span>All systems online</span>
        </p>
      </div>
    </>
  )
}

HudToggle.beforeDOMLoaded = hudScript
HudToggle.css = `
.hud-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 32px;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  flex-shrink: 0;

  & svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: var(--darkgray);
    stroke-width: 2;
    stroke-linecap: round;
  }
}

.hud-overlay,
.hud-reticle,
.hud-boot {
  display: none;
}
`

export default (() => HudToggle) satisfies QuartzComponentConstructor
