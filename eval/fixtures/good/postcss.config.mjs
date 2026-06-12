// GT12 fixture (S18) — the Tailwind v4 PostCSS plugin is `@tailwindcss/postcss` (the v3 inline
// `tailwindcss` plugin reference silently no-ops under v4). GT12 (L1) asserts the config refs
// `@tailwindcss/postcss`.
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
