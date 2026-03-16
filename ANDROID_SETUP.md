# Setup Panduan: Gridio Next.js + Capacitor Android

## ✅ Selesai Setup

Struktur project sudah siap dengan:
- Platform detection (`lib/platform.ts`)
- Mobile UI seperti chat (`components/mobile/MobileBudgetPage.tsx`)
- Conditional rendering (Web vs Mobile)
- Capacitor + Android project configured

---

## 🚀 Cara Menjalankan

### A. Testing Mobile UI (Recommended - Cara Cepat)

#### Di Browser (untuk test chat UI sebelum buat APK)
```bash
npm run dev
```
Buka: `http://localhost:3000/budget`

Buka DevTools (F12) → Device Toolbar (Ctrl+Shift+M) → Pilih device Android

---

#### Di Android Emulator (Realistis - dengan Capacitor)

**Step 1: Pastikan Android Studio & Emulator sudah installed**

**Step 2: Start Next.js dev server**
```bash
npm run dev
```
Server akan jalan di `http://localhost:3000` (port ini penting!)

**Step 3: Buka Android Emulator**
- Buka Android Studio → Device Manager → Buat atau pilih emulator
- Jalankan emulator (tunggu sampai siap)

**Step 4: Build dan sync ke emulator**
```bash
npx cap open android
```
Ini buka Android Studio dengan project Android.

Di Android Studio:
- Menu: Run → Run 'app'
- Pilih emulator yang sudah berjalan
- Tekan OK

Emulator akan build dan launch app Gridio.

**Step 5: Test**
- App akan load dari localhost (automatic via Capacitor config)
- Simulasi sama seperti APK asli
- Try input cepat: `BCA makanan 20000`

---

### B. Build APK untuk Production

#### Persyaratan:
- Java Development Kit (JDK) 17+
- Android SDK (via Android Studio)
- Node.js (sudah ada)
- Capacitor AndroidSL configured (done)

#### Steps:

1. **Build Next.js**
   ```bash
   npm run build
   ```

2. **Update Capacitor config untuk production**
   Edit `capacitor.config.ts` dan ubah:
   ```typescript
   // Hapus server.url untuk production
   const config: CapacitorConfig = {
     appId: 'com.ravination.gridio',
     appName: 'gridio',
     webDir: 'public'
   };
   ```

3. **Sync & build APK**
   ```bash
   npx cap sync
   npx cap open android
   ```

4. **Di Android Studio**
   - Build → Build Bundle(s)/APK(s) → Build APK(s)
   - Tunggu proses build selesai

5. **Hasilnya**
   - APK: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Bisa install ke device/emulator dengan:
     ```bash
     adb install android/app/build/outputs/apk/debug/app-debug.apk
     ```

---

## 🔧 konfigurasi Important

### For Emulator (Development)
```typescript
// capacitor.config.ts
const DEV_SERVER_URL = 'http://10.0.2.2:3000';
// 10.0.2.2 adalah magic IP untuk access localhost dari Android emulator
```

### For Physical Device (Development)
Ganti IP sesuai computer kamu:
```typescript
const DEV_SERVER_URL = 'http://192.168.x.x:3000';
// Cek IP dengan: ipconfig (Windows) atau ifconfig (Mac/Linux)
```

Pastikan device dan computer di network yang sama!

---

## 📱 Testing Checklist

- [ ] npm run dev sudah berjalan
- [ ] Akses http://localhost:3000/budget di browser
- [ ] Chat interface muncul dengan baik
- [ ] Test input cepat: "BCA makanan 20000"
- [ ] Emulator sudah running
- [ ] APK build dari Android Studio
- [ ] Instal & test di emulator
- [ ] Cek mobile UI (tidak sama dengan web)

---

## 📂 Project Structure

```
/android/                  ← Native Android project (auto-generated)
  /app/src/main/assets/    ← Assets untuk APK

/capacitor.config.ts       ← Konfigurasi (server URL, webDir, dll)

/public/
  /index.html              ← Entry point untuk WebView

/lib/
  /platform.ts             ← isNative() detection

/components/mobile/
  /MobileBudgetPage.tsx    ← Chat-like mobile UI

/app/budget/page.tsx       ← Conditional render Web/Mobile
```

---

## 💡 Useful Commands

```bash
# Development
npm run dev                      # Start Next.js server
npx cap open android            # Open Android Studio

# Building
npm run build                    # Build Next.js
npx cap sync                     # Sync to Capacitor

# Shortcuts (dari package.json)
npm run cap:sync                 # npx cap sync
npm run cap:android              # npx cap open android
npm run cap:build                # npm run build && npx cap sync
npm run android:dev              # npm run cap:build && npm run cap:android
```

---

## 🆘 Troubleshooting

### "Cannot connect to 10.0.2.2:3000"
- Pastikan Next.js server sudah jalan (`npm run dev`)
- Pastikan firewall tidak block port 3000
- Check: http://localhost:3000 di Windows browser

### "Could not find Android SDK"
```bash
# Set environment variable
# Windows: System Properties → Environment Variables
# ANDROID_HOME = C:\Users\[username]\AppData\Local\Android\Sdk
```

### APK terlalu besar
Normal untuk WebView + Next.js (~50-100MB)
Gunakan minification untuk reduce bundle size

### Mobile UI tidak muncul di APK
- Periksa `isNative()` mendeteksi platform
- Check browser console: Press Ctrl+Shift+I (emulator)
- Verifikasi `@capacitor/core` installed di package.json

### Perubahan kode tidak langsung reload
Di Capacitor dev + emulator, manual refresh:
- Pull down to refresh (jika implemented)
- Atau rebuild dari Android Studio

---

## 🔐 API & Networking

### Development
- Next.js server: `localhost:3000`
- Emulator akses via: `10.0.2.2:3000`
- Device akses via: `[PC_IP]:3000`

### Production APK
- Semua API calls ke backend yang dideploy
- Update backend URL di capacitor config atau env vars

---

## 📊 Performance Tips

1. **Dev Server di port 3000** tetap untuk development
2. **Emulator lebih cepat dari device** untuk testing
3. **Hot reload**: Ubah kode → npm run build → npx cap sync → refresh
4. **Build time**: ~3-5 menit untuk APK (pertama kali), ~30 detik rebuild

---

## ❓ FAQ

**Q: Bisa update app tanpa rebuild APK?**
A: Ya! Update kode → build → sync → refresh. Cocok untuk development.

**Q: APK bisa distribusi ke main?**
A: Ya, build APK release → sign → upload ke Play Store

**Q: Offline support?**
A: Bisa, pakai Service Workers atau local caching (PWA)

**Q: Bisakah pakai database offline?**
A: Ya, pakai SQLite via Capacitor plugin

**Q: Performance vs native app?**
A: ~70-80% performa native (cukup untuk CRUD apps)

---

## 📝 Next Steps

1. ✅ Setup selesai - lanjut test di emulator
2. Test mobile UI dengan sample data
3. Optimize performance jika diperlukan
4. Build release APK untuk distribution
5. Setup auto-update (optional, pakai Capacitor update plugin)

---

Created: 2026-03-15  
Next.js 16 + Capacitor Android Setup  
Platform: Windows

