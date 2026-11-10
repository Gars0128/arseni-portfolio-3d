import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base works both on <user>.github.io and on <user>.github.io/<repo>.
export default defineConfig({ base: './', plugins: [react()] })
