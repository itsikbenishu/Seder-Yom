import { defineConfig } from "vitest/config";

// No @vitejs/plugin-react here on purpose: the React Compiler babel pass it runs
// is slow enough to stall the test workers, and tests don't need it. Vitest's
// built-in transform reads the automatic JSX runtime from tsconfig (jsx: react-jsx).
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    pool: "threads",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
