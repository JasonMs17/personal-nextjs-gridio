'use client'

import { Capacitor } from '@capacitor/core'

let capacitorReady = false

// Signal when Capacitor is ready
if (typeof window !== 'undefined') {
  if (document) {
    document.addEventListener('capacitorReady', () => {
      capacitorReady = true
      console.log('Capacitor is ready')
    })
  }
}

export const isNative = (): boolean => {
  try {
    // Check if we're in a Capacitor environment
    if (typeof window === 'undefined') return false
    
    // Check if Capacitor is available globally
    const CapacitorGlobal = (globalThis as any).Capacitor
    if (!CapacitorGlobal) return false
    
    return Capacitor.isNativePlatform()
  } catch (error) {
    console.warn('Error checking native platform:', error)
    return false
  }
}

export const getPlatform = (): 'web' | 'android' | 'ios' => {
  try {
    if (typeof window === 'undefined') return 'web'
    
    const CapacitorGlobal = (globalThis as any).Capacitor
    if (!CapacitorGlobal) {
      return 'web'
    }
    
    if (!Capacitor.isNativePlatform()) {
      return 'web'
    }
    
    const platform = Capacitor.getPlatform()
    return platform as 'android' | 'ios'
  } catch (error) {
    console.warn('Error getting platform:', error)
    return 'web'
  }
}

export const waitForCapacitor = async (timeout: number = 5000): Promise<boolean> => {
  if (capacitorReady) return true
  if (typeof document === 'undefined') return false
  
  try {
    return await new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(capacitorReady)
      }, timeout)
      
      document.addEventListener('capacitorReady', () => {
        clearTimeout(timer)
        resolve(true)
      }, { once: true })
    })
  } catch {
    return false
  }
}

