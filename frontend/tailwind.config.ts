import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Tailwind v4 uses a CSS-first config — the theme (colors, radii, fonts) lives
 * in `src/app/globals.css` under `@theme inline`. This file only sets dark mode,
 * the content globs, and plugins. Semantic utilities (`bg-background`,
 * `text-foreground`, `bg-primary`, `border-border`, …) flip automatically with
 * the `.dark` class, so you should rarely need a ` variant.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [tailwindcssAnimate],
};
export default config;
