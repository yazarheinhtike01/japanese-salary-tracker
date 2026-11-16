# Japanese Monthly Salary Tracker （給与トラッカー）

iOS / Android အတွက် React Native (Expo) နဲ့ ဆောက်ထားတဲ့ **တကယ့် mobile app** project ပါ — website မဟုတ်ပါဘူး။
Data အားလုံး ဖုန်းထဲမှာပဲ သိမ်းပါတယ် (AsyncStorage)။ ဘယ်ကိုမှ မ upload ပါဘူး။

A real **mobile app** project (React Native + Expo) for iOS and Android — not a website.
All data is stored on the phone only. Nothing is uploaded anywhere.

**Tech stack:** React Native 0.76 · Expo SDK 52 · JavaScript · AsyncStorage (on-device persistence) · expo-print / expo-sharing (PDF & CSV reports) · Node.js test runner for the calculation engine (14 unit tests, all passing).

## Features (spec အတိုင်း)

- **Exact minute-based calculation** — late/early ကို မိနစ် အတိအကျနဲ့ တွက်တယ်။ 15/30 min rounding မရှိဘူး။
  - e.g. 07:00–16:00 scheduled, 07:16 ဝင်ရင် late = 16 min အတိအကျ။
- **Shifts** — Day 07:00–16:00 / 07:00–17:00 @ ¥1,350/h, Evening 18:00–22:45 @ ¥1,400/h, plus custom shifts (overnight လည်း ရတယ်, e.g. 23:00–05:00). တစ်ရက်ထဲ shift အများကြီး ထည့်လို့ရတယ်။
- **Unpaid breaks** — 12:00–13:00 နဲ့ 17:00–18:00။ အလုပ်ချိန်နဲ့ ထပ်တဲ့ အပိုင်းကိုပဲ နုတ်တယ်၊ နှစ်ခါ ဘယ်တော့မှ မနုတ်ဘူး (union calculation)။ Settings မှာ ပြင်လို့ရတယ်။
- **Japanese public holidays** — တကယ့် 祝日 calendar (rule-based: Happy Monday, 春分/秋分， 振替休日, 国民の休日 အထိ ပါတယ်)။ Sunday နဲ့ 祝日 ကို အနီရောင်၊ နာမည်နဲ့ ပြတယ်။ ပိတ်ရက်လည်း အလုပ်ချိန် ထည့်လို့ရတယ် — **နှုန်းက ပုံမှန်အတိုင်းပဲ, bonus အလိုအလျောက် မပေါင်းဘူး**။ Settings မှာ ကိုယ့်ဘာသာ ပိတ်ရက် ထည့်/ဖျက် လို့ရတယ်။
- **Salary period** — အရင်လ 21 ရက်ကနေ ဒီလ 20 ရက်။ **Payday** နောက်လ 10 ရက်။ အလိုအလျောက် တွက်ပေးတယ်။
- **Calendar + weekly schedule** — Mon–Sun အလိုက် schedule သတ်မှတ်ပြီး တစ်လလုံး တစ်ချက်နှိပ် ဖြည့်လို့ရတယ်။
- **Dashboard** — စုစုပေါင်း လစာ၊ အလုပ်ဆင်းရက်၊ အလုပ်ချိန်၊ Day/Evening ခွဲရငွေ၊ late/early စုစုပေါင်း၊ break နာရီ၊ holiday အလုပ်ချိန်၊ payday။
- **History & reports** — အရင် period တွေ အကုန်၊ daily record အသေးစိတ်၊ edit/delete (ပြန်တွက်ပေးတယ်)၊ **PDF / CSV export**။
- **Languages** — မြန်မာ / English / 日本語 (Settings မှာ ပြောင်းလို့ရ)
- **Dark / Light mode**၊ JPY currency.

## Run လုပ်နည်း (your PC)

```bash
npm install
npx expo start
```

ဖုန်းမှာ **Expo Go** app (App Store / Google Play, free) ထည့်ပြီး QR code ကို scan လိုက်ရင် ကိုယ့်ဖုန်းပေါ်မှာ app တကယ် run ပါတယ်။

## Install လုပ်လို့ရတဲ့ app အဖြစ် build နည်း

```bash
npm install -g eas-cli
eas login          # free Expo account
eas build -p android --profile preview   # .apk file ရမယ်
eas build -p ios --profile preview       # iOS (Apple Developer account လိုပါတယ်)
```

## Tests

Calculation engine ကို သူ့ spec example တွေ အပါအဝင် test 14 ခု စစ်ထားပြီး အကုန် pass ဖြစ်ပါတယ်:

```bash
npm test   # node test/engine.test.js
```

## Project structure

```
App.js                  app shell, custom bottom bar (+ button)
src/engine.js           salary calculation (pure JS, unit-tested)
src/holidays.js         Japanese holiday rules + user overrides
src/i18n.js             မြန်မာ / English / 日本語 strings
src/theme.js            original pay-slip & hanko design (light/dark)
src/store.js            on-device persistence
src/export.js           CSV / PDF report builders
src/screens/            Calendar, Dashboard, History, Settings, ShiftEditor
test/engine.test.js     calculation tests
```

## မှတ်ချက်

- Calculation logic ကို unit test 14 ခုနဲ့ စစ်ပြီးပါပြီ (အကုန် pass)။ App UI ကို တကယ့် ဖုန်းပေါ်မှာ မစမ်းရသေးတဲ့အတွက် ပထမဆုံး run တဲ့အခါ error ပေါ်လာရင် စစ်ပြီး ပြင်နိုင်ပါတယ်။
