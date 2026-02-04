import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReactErrorUtilsTesting',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', '@react-error-utils/core'],
      output: {
        globals: {
          react: 'React',
          '@react-error-utils/core': 'ReactErrorUtilsCore'
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})
