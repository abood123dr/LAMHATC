import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import fs from 'fs'
import path from 'path'

function loadEnvTypeFile() {
  const filePath = path.resolve(__dirname, '.envtype')
  if (!fs.existsSync(filePath)) return {}
  const bytes = fs.readFileSync(filePath)
  const content = bytes[0] === 0xff && bytes[1] === 0xfe
    ? bytes.toString('utf16le')
    : bytes.toString('utf8')

  return content
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return env
      const [key, ...valueParts] = trimmed.split('=')
      if (key.startsWith('VITE_')) env[key] = valueParts.join('=')
      return env
    }, {})
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const fallbackEnv = loadEnvTypeFile()
  const runtimeEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'))
  )
  const exposedEnv = { ...fallbackEnv, ...fileEnv, ...runtimeEnv }

  return {
    plugins: [react()],
    define: Object.fromEntries(
      Object.entries(exposedEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])
    ),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      watch: {
        ignored: ['**/.vs/**', '**/node_modules/**'],
      },
    },
  }
})
