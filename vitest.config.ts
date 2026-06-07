import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
    // occt-import-js is CJS+wasm — let Vitest process it instead of externalizing
    server: { deps: { inline: ['occt-import-js'] } },
    setupFiles: ['test/setup.ts'],
  },
});
