import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: '쑥쑥일기 - 우리 아이 성장 기록',
        short_name: '쑥쑥일기',
        description: '아이의 성장과 발달을 기록하고 관리하는 육아 필수 앱',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192', // SVG는 크기 무관하지만 명시 필요
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
