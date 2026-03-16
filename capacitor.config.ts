import type { CapacitorConfig } from '@capacitor/cli'

// For Android Emulator, localhost is 10.0.2.2
// For physical device, change to your computer's IP (e.g., 192.168.x.x)
const DEV_SERVER_URL = 'https://gridio1.vercel.app'
const PROD_SERVER_URL = 'https://gridio1.vercel.app'

// Allow overriding via env for staging/QA. Defaults to prod on production builds.
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ??
  (process.env.NODE_ENV === 'production' ? PROD_SERVER_URL : DEV_SERVER_URL)

const isClearText = serverUrl.startsWith('http://')

const config: CapacitorConfig = {
  appId: 'com.ravination.gridio',
  appName: 'gridio',
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext: isClearText,
    androidScheme: isClearText ? 'http' : 'https'
  }
}

export default config
