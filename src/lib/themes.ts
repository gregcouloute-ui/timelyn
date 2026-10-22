/**
 * The looks a viewer can choose between. The tokens for each live in
 * src/app/globals.css under [data-theme="…"]. The choice is a per-browser
 * preference kept in a cookie, so pages render in it without a flash.
 */
export const THEMES = [
  { id: "bold", name: "Bold", description: "Big type, bright colour, rounded cards", swatches: ["#e4ff7a", "#8c9bff", "#ff8ac6"] },
  { id: "brutal", name: "Neo-brutal", description: "Thick outlines and hard shadows", swatches: ["#ffffff", "#93c5fd", "#ffd23f"] },
  { id: "scrapbook", name: "Scrapbook", description: "Taped-in photos and handwritten notes", swatches: ["#f7f5f0", "#ffe873", "#ffc4ae"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "bold";
export const THEME_COOKIE = "timelyn_theme";

export function toThemeId(value: unknown): ThemeId {
  return THEMES.some((t) => t.id === value) ? (value as ThemeId) : DEFAULT_THEME;
}
