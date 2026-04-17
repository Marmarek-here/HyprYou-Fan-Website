(async () => {

const { argbFromHex, hexFromArgb, themeFromSourceColor } = await import(
  "https://esm.sh/@material/material-color-utilities"
);

const tabs = [...document.querySelectorAll("[data-tab]")];
const panels = [...document.querySelectorAll("[data-panel]")];
const swatches = [...document.querySelectorAll(".swatch")];
const modeToggles = [...document.querySelectorAll(".mode-toggle")];
const jumpButtons = [...document.querySelectorAll("[data-jump-tab]")];
const inspectButtons = [...document.querySelectorAll("[data-inspect-src]")];
const colorInput = document.getElementById("theme-color");
const applyCustomThemeButton = document.getElementById("apply-custom-theme");
const themeProbe = document.querySelector(".theme-probe");
const lightbox = document.getElementById("shot-lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxCaption = document.getElementById("lightbox-caption");
const lightboxZoomIn = document.getElementById("lightbox-zoom-in");
const lightboxZoomOut = document.getElementById("lightbox-zoom-out");
const lightboxCloseInline = document.getElementById("lightbox-close-inline");

const state = {
  seed: "browser",
  brightness: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  zoom: 1
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function rgbStringToHex(rgbString) {
  const match = rgbString.match(/\d+/g);
  if (!match || match.length < 3) {
    return null;
  }

  const [red, green, blue] = match.slice(0, 3).map(Number);
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function getBrowserSeed() {
  const rawColor = getComputedStyle(themeProbe).color;
  return rgbStringToHex(rawColor) || "#6f9d6d";
}

function argbToRgba(argb, alpha) {
  const r = (argb >> 16) & 0xff;
  const g = (argb >> 8) & 0xff;
  const b = argb & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyPalette(seedHex) {
  const isDark = state.brightness === "dark";
  const root = document.documentElement;

  const theme = themeFromSourceColor(argbFromHex(seedHex));
  const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
  const nt = theme.palettes.neutral;

  root.style.setProperty("--primary", hexFromArgb(scheme.primary));
  root.style.setProperty("--on-primary", hexFromArgb(scheme.onPrimary));
  root.style.setProperty("--primary-container", hexFromArgb(scheme.primaryContainer));
  root.style.setProperty("--secondary-container", hexFromArgb(scheme.secondaryContainer));
  root.style.setProperty("--tertiary-container", hexFromArgb(scheme.tertiaryContainer));

  root.style.setProperty("--page-bg", hexFromArgb(nt.tone(isDark ? 6 : 98)));
  root.style.setProperty("--surface", hexFromArgb(scheme.surface));
  root.style.setProperty("--surface-alt", hexFromArgb(nt.tone(isDark ? 17 : 94)));
  root.style.setProperty("--surface-container", hexFromArgb(nt.tone(isDark ? 22 : 90)));
  root.style.setProperty("--outline", hexFromArgb(scheme.outline));
  root.style.setProperty("--text", hexFromArgb(scheme.onBackground));
  root.style.setProperty("--text-soft", hexFromArgb(scheme.onSurfaceVariant));

  root.style.setProperty("--code-bg", hexFromArgb(nt.tone(isDark ? 12 : 15)));
  root.style.setProperty("--code-fg", hexFromArgb(nt.tone(isDark ? 90 : 92)));
  root.style.setProperty("--scrim", argbToRgba(nt.tone(0), isDark ? 0.8 : 0.58));

  root.style.setProperty("--scrollbar-track", hexFromArgb(nt.tone(isDark ? 18 : 88)));
  root.style.setProperty("--scrollbar-thumb", hexFromArgb(nt.tone(isDark ? 38 : 58)));
  root.style.setProperty("--scrollbar-thumb-hover", hexFromArgb(nt.tone(isDark ? 48 : 46)));
}

function syncSwatches() {
  swatches.forEach((swatch) => {
    const isBrowser = state.seed === "browser" && swatch.dataset.seed === "browser";
    const isMatch = state.seed !== "browser" && swatch.dataset.seed?.toLowerCase() === state.seed.toLowerCase();
    swatch.classList.toggle("is-selected", isBrowser || isMatch);
  });
}

function syncModeButtons() {
  modeToggles.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.brightness === state.brightness);
  });
  document.body.dataset.brightness = state.brightness;
}

function persistTheme() {
  localStorage.setItem("hypryou-site-theme", JSON.stringify(state));
}

function refreshTheme() {
  const actualSeed = state.seed === "browser" ? getBrowserSeed() : state.seed;
  applyPalette(actualSeed);
  syncSwatches();
  syncModeButtons();
  persistTheme();
}

function showPanel(panelName) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === panelName;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  panels.forEach((panel) => {
    const isActive = panel.id === `panel-${panelName}`;
    panel.classList.toggle("is-visible", isActive);
    panel.hidden = !isActive;
  });

  jumpButtons.forEach((button) => {
    const isActive = button.dataset.jumpTab === panelName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  document.body.dataset.activePanel = panelName;
}

function applyLightboxZoom() {
  lightboxImage.style.transform = `scale(${state.zoom})`;
}

function openLightbox(src, label) {
  if (!lightbox || !lightboxImage || !lightboxCaption) {
    return;
  }

  state.zoom = 1;
  lightboxImage.src = src;
  lightboxCaption.textContent = label;
  applyLightboxZoom();
  lightbox.showModal();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => showPanel(tab.dataset.tab));
});

jumpButtons.forEach((button) => {
  button.addEventListener("click", () => showPanel(button.dataset.jumpTab));
});

inspectButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openLightbox(button.dataset.inspectSrc, button.dataset.inspectLabel || "Screenshot");
  });
});

if (lightboxZoomIn && lightboxZoomOut) {
  lightboxZoomIn.addEventListener("click", () => {
    state.zoom = clamp(state.zoom + 0.2, 0.8, 2.6);
    applyLightboxZoom();
  });

  lightboxZoomOut.addEventListener("click", () => {
    state.zoom = clamp(state.zoom - 0.2, 0.8, 2.6);
    applyLightboxZoom();
  });
}

if (lightboxCloseInline && lightbox) {
  lightboxCloseInline.addEventListener("click", () => lightbox.close());
}

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  const hasCompact = document.body.classList.contains("compact-header");
  if (!hasCompact && y > 180) {
    document.body.classList.add("compact-header");
  } else if (hasCompact && y < 110) {
    document.body.classList.remove("compact-header");
  }
});

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    state.seed = swatch.dataset.seed === "browser" ? "browser" : swatch.dataset.seed;
    if (state.seed !== "browser") {
      colorInput.value = state.seed;
    }
    refreshTheme();
  });
});

modeToggles.forEach((button) => {
  button.addEventListener("click", () => {
    state.brightness = button.dataset.brightness;
    refreshTheme();
  });
});

applyCustomThemeButton.addEventListener("click", () => {
  state.seed = colorInput.value;
  refreshTheme();
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  if (!localStorage.getItem("hypryou-site-theme")) {
    state.brightness = event.matches ? "dark" : "light";
    refreshTheme();
  }
});

const storedTheme = localStorage.getItem("hypryou-site-theme");
if (storedTheme) {
  try {
    const parsed = JSON.parse(storedTheme);
    if (parsed.seed) {
      state.seed = parsed.seed;
    }
    if (parsed.brightness) {
      state.brightness = parsed.brightness;
    }
  } catch {
    localStorage.removeItem("hypryou-site-theme");
  }
}

if (state.seed !== "browser") {
  colorInput.value = state.seed;
}

showPanel("overview");
refreshTheme();

const iconAnimationClassNames = [
  "icon-anim",
  "icon-anim-default",
  "icon-anim-download",
  "icon-anim-spin",
  "icon-anim-spark"
];

function pickIconAnimationClass(iconName) {
  if (["download", "download_for_offline", "deployed_code_update"].includes(iconName)) {
    return "icon-anim-download";
  }

  if (["sync", "refresh", "autorenew", "gesture_select"].includes(iconName)) {
    return "icon-anim-spin";
  }

  if (["auto_awesome", "palette", "photo_library", "imagesmode", "zoom_in"].includes(iconName)) {
    return "icon-anim-spark";
  }

  return "icon-anim-default";
}

// Icon animation on button click with icon-specific motion profiles
document.addEventListener("click", (e) => {
  const button = e.target.closest(
    ".tab, .quick-link, .hero-action, .mode-toggle, .tonal-button, .inspect-button, .lightbox-button, .swatch"
  );
  if (!button) return;
  const icon = button.querySelector(".material-symbols-rounded");
  if (!icon) return;
  const iconName = icon.textContent.trim();
  const animClass = pickIconAnimationClass(iconName);

  icon.classList.remove(...iconAnimationClassNames);
  // Force reflow so re-adding the class restarts the animation
  void icon.offsetWidth;
  icon.classList.add(animClass);
  icon.addEventListener("animationend", () => icon.classList.remove(...iconAnimationClassNames), { once: true });
});

})();