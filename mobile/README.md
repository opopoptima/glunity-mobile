# GlUnity Mobile — Frontend

React Native (Expo SDK 55) mobile application for the GlUnity gluten-free platform.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Configure API URL (IMPORTANT for physical devices)
# Edit: src/core/config/api.config.ts
# Replace 192.168.1.100 with your machine's local IP
# Run `ipconfig` on Windows to find your IP

# 3. Start Expo dev server
npx expo start

# 4. Scan QR code with Expo Go app on your phone
#    OR press 'a' for Android emulator, 'i' for iOS simulator
```

> **Android emulator** → use `http://10.0.2.2:5000/api`  
> **iOS simulator** → use `http://localhost:5000/api`  
> **Physical device** → use your machine's local IP, e.g. `http://192.168.1.100:5000/api`

---

## 📁 Project Architecture

```
mobile/
├── App.tsx                        ← Root: GestureHandler + NavigationContainer + AuthProvider
├── app.json                       ← Expo config
├── babel.config.js
├── tsconfig.json
└── src/
    ├── core/                      ← App-wide infrastructure
    │   ├── config/
    │   │   └── api.config.ts      ← API base URL configuration
    │   ├── network/
    │   │   └── http.client.ts     ← Axios instance + auth interceptor + auto-refresh
    │   ├── storage/
    │   │   └── secure-store.ts    ← expo-secure-store: get/set/clear tokens
    │   └── (other folders: analytics, errors, i18n, notifications, permissions, realtime)
    │
    ├── modules/                   ← Feature modules
    │   └── auth/
    │       ├── api/
    │       │   └── auth.api.ts    ← login, register, logout, getMe (typed)
    │       ├── navigation/
    │       │   └── types.ts       ← AuthStackParamList type definitions
    │       ├── state/
    │       │   ├── auth.reducer.ts   ← Typed actions + state shape
    │       │   ├── auth.context.tsx  ← AuthProvider + useAuth hook
    │       │   └── auth.actions.ts   ← (skeleton)
    │       └── ui/
    │           ├── screens/
    │           │   ├── SplashScreen.tsx        ← ✅ Green animated splash (auto → Intro)
    │           │   ├── IntroductionScreen.tsx  ← ✅ 3-slide onboarding carousel
    │           │   ├── WelcomeScreen.tsx       ← ✅ Welcome with Se connecter / Créer un compte
    │           │   ├── LoginScreen.tsx         ← ✅ Login with API integration
    │           │   ├── RegisterScreen.tsx      ← ✅ Register with API integration
    │           │   └── ForgotPasswordScreen.tsx← ✅ Forgot password (UI ready)
    │           └── components/                ← (module-specific components)
    │
    ├── navigation/
    │   ├── types.ts               ← Re-exports all param list types
    │   ├── AuthNavigator.tsx      ← Stack: Splash → Intro → Welcome → Login/Register
    │   ├── AppNavigator.tsx       ← Stack: Home (placeholder + logout)
    │   └── RootNavigator.tsx      ← Auth guard: shows spinner → Auth or App stack
    │
    └── shared/
        ├── components/
        │   ├── AuthInput.tsx      ← Reusable input with focus/error states + right icon
        │   └── AuthButton.tsx     ← Reusable button (filled / outlined variants + loading)
        └── utils/
            └── theme.ts           ← Design tokens: Colors, Font weights, Radius, Spacing
```

---

## 🎨 Screen Flow

```
App Launch
    │
    ▼
SplashScreen          ← green bg, 🌾 logo, animated fade-in, 2.5s timer
    │ auto (replace)
    ▼
IntroductionScreen    ← 3 slides: Scan / Map / Community, swipeable carousel
    │ last slide → (replace)
    ▼
WelcomeScreen         ← "Salut, Bienvenue!" — two CTA buttons
    ├── Se connecter ─────► LoginScreen ──────► [Authenticated]
    │                            │
    │                    Forgot Password ──► ForgotPasswordScreen
    │
    └── Créer un compte ──► RegisterScreen ──► [Authenticated]
```

---

## 🔐 Auth State Management

```
AuthProvider (React Context + useReducer)
    │
    ├── On mount: checks SecureStore for token → calls GET /auth/me
    ├── login()    → POST /auth/login    → stores tokens → dispatch SET_USER
    ├── register() → POST /auth/register → stores tokens → dispatch SET_USER
    └── logout()   → POST /auth/logout   → clears tokens → dispatch CLEAR_USER

Axios HTTP Client (http.client.ts)
    ├── Request interceptor:  injects Bearer token from SecureStore
    └── Response interceptor: on 401 → refreshes token → retries original request
```

---

## 🎨 Design System (`src/shared/utils/theme.ts`)

| Token | Values |
|-------|--------|
| `Colors.bg` | `#F6F5F3` — App background |
| `Colors.green` | `#8BC34A` — Primary brand color |
| `Colors.dark` | `#2E2E2E` — Text |
| `Colors.muted` | `rgba(46,46,46,0.5)` — Secondary text |
| `Colors.error` | `#E53935` — Validation errors |
| `Colors.white` | `#FFFFFF` |

---

## 🖥️ Screens Detail

### SplashScreen
- Full-screen green (`#8BC34A`) background
- Animated logo fade-in + slide-up (800ms)
- Decorative pink circle + heart decorations
- Auto-navigates to `Intro` after **2.5 seconds** using `navigation.replace`

### IntroductionScreen (3-slide carousel)
| Slide | Title | Illustration |
|-------|-------|-------------|
| 1 | Scannez Vos **Aliments** | Product card with barcode + ✓ badge |
| 2 | Trouvez Des **Lieux Sûrs** | Map grid with location pin |
| 3 | Rejoignez La **Communauté** | Chat bubbles (white + green) |

- Swipeable via `FlatList` with `pagingEnabled`
- Red dot indicator (outlined = active, filled = inactive)
- White circle back button + green circle next button
- Last slide next button shows `✓` and navigates to `Welcome`

### WelcomeScreen
- Mascot emoji in green glow circle
- "Salut, Bienvenue!" heading
- **Se connecter** (filled green) → Login
- **Créer un compte** (outlined green) → Register
- Green wave decoration at bottom

### LoginScreen
- Email + password fields with focus highlight
- Show/hide password toggle (👁️ / 🙈)
- Client-side validation before API call
- Error banner for API errors
- "Forgot Password?" link
- "No Account? Register" switch

### RegisterScreen
- Full name, email, password, confirm password fields
- Password strength rules: min 8 chars, 1 uppercase, 1 number
- Show/hide on both password fields
- Error banner for API/validation errors
- "Already have an account? Login" switch

### ForgotPasswordScreen
- Email input + "Send Reset Link" button
- Success state with confirmation message
- Back navigation

---

## 📦 Dependencies

```json
{
  "expo": "^55.0.13",
  "react": "19.2.0",
  "react-native": "0.83.4",
  "expo-secure-store": "~55.0.13",
  "expo-font": "~55.0.6",
  "expo-linear-gradient": "~55.0.13",
  "expo-status-bar": "~55.0.5",
  "@react-navigation/native": "^7.x",
  "@react-navigation/native-stack": "^7.x",
  "react-native-screens": "~4.23.0",
  "react-native-safe-area-context": "~5.6.2",
  "react-native-gesture-handler": "~2.30.0",
  "react-native-reanimated": "4.2.1",
  "axios": "^1.15.0",
  "@react-native-async-storage/async-storage": "2.2.0",
  "typescript": "~5.9.2",
  "@types/react": "~19.2.10",
  "@types/react-native": "*"
}
```

---

## ⚠️ Important Notes

> **API URL** — Update `src/core/config/api.config.ts` with your machine's local IP before testing on a physical device.

> **Backend must be running** — Start the API server (`cd api && npm run dev`) before launching the app. The app will silently fail auth calls if the API is unreachable.

> **MongoDB Atlas** — The backend requires your IP to be whitelisted in Atlas Network Access before it can connect.

> **Skeleton modules** — `community`, `events`, `home`, `map`, `products`, `profile`, `recipes`, `search`, `seller`, `settings` are scaffolded in `src/modules/` but not yet implemented.
