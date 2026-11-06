import { networkInterfaces } from 'node:os'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

function getLanAddress(): string | undefined {
  const addresses = Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter((entry) => entry.family === 'IPv4' && !entry.internal)
    .map((entry) => entry.address)
    .filter((address) => {
      const [first, second] = address.split('.').map(Number)
      return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)
    })

  return addresses.find((address) => address.startsWith('192.168.')) ?? addresses[0]
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const lanAddress = getLanAddress()
  const publicOrigin = env.VITE_PUBLIC_ORIGIN ?? (lanAddress ? `http://${lanAddress}` : '')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_PUBLIC_ORIGIN': JSON.stringify(mode === 'development' ? publicOrigin : ''),
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': 'http://localhost:8080',
        '/r': 'http://localhost:8080',
      },
    },
  }
})
