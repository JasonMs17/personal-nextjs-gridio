# 🚀 Quick Start - Testing Mobile UI

## Option 1: Browser (Fastest)
```bash
npm run dev
# Buka: http://localhost:3000/budget
# DevTools → Device Toolbar → Mobile view
```

## Option 2: Android Emulator (Realistic)
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start emulator & app
npx cap open android
# Di Android Studio: Run → Run 'app' → pilih emulator
```

## Option 3: Build APK
```bash
npm run build
npx cap sync
npx cap open android
# Di Android Studio: Build → Build APK(s)
```

## Mobile Features
- 💬 Chat-like quick input
- 📝 Format: `account kategori angka` (e.g., `BCA makanan 20000`)
- ✅ Real-time validation
- 📊 Income/Expense toggle
- 💰 Summary stats

---

Baca **ANDROID_SETUP.md** untuk detail lengkap!
