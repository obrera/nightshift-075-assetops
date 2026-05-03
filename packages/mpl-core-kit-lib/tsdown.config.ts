import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    generated: 'src/generated/index.ts',
    helpers: 'src/helpers/index.ts',
    hooked: 'src/hooked/index.ts',
    index: 'src/index.ts',
    plugins: 'src/plugins/index.ts',
  },
  format: ['esm', 'cjs'],
  sourcemap: true,
})
