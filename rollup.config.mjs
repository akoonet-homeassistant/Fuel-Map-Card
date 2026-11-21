import { readFileSync } from "node:fs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

// Importe les .css comme texte (injectés dans le Shadow DOM).
// Imports .css files as text (injected into the Shadow DOM).
const cssText = () => ({
  name: "css-text",
  load(id) {
    if (!id.endsWith(".css")) return null;
    const css = readFileSync(id, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
    return `export default ${JSON.stringify(css)};`;
  },
});

export default {
  input: "src/fuel-map-card.js",
  output: { file: "dist/fuel-map-card.js", format: "es", sourcemap: false },
  plugins: [cssText(), resolve(), terser({ format: { comments: false } })],
};
