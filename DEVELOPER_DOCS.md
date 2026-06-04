# FinPilot — Developer Documentation

> If you're taking over this project, start here. This file explains how everything works.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Runs at `http://localhost:5173/`. No environment variables needed — all data is stored in browser `localStorage`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Language | JavaScript (NOT TypeScript) |
| Styling | Tailwind CSS v4 |
| Components | ShadCN UI (manually created, not CLI-installed) |
| State | Zustand with `persist` middleware → localStorage |
| Charts | Recharts |
| Forms | React Hook Form + Zod validation |
| Routing | React Router v7 (lazy loaded) |
| Animation | Framer Motion |
| Icons | Lucide React |
| PWA | vite-plugin-pwa + Workbox |
| Dates | date-fns |
| Export | jsPDF + jspdf-autotable + xlsx |

---

## Architecture

```
User → React UI → Zustand Store → localStorage
                      ↓
              Pure Calculations (lib/)
                      ↓
              Charts & Forms
```

### No Backend
All data lives in `localStorage` via Zustand's `persist` middleware. Key: `finpilot-storage`. No server, no API, no database. The `exportData()` / `importData()` functions in the store allow backup/restore as JSON files.

---

## Folder Map

```
src/
├── components/
│   ├── ui/             ← ShadCN base components (button, card, dialog, tabs, etc.)
│   ├── layout/         ← AppLayout, BottomNav, Sidebar
│   ├── transactions/   ← AddTransactionSheet
│   └── LockScreen.jsx  ← Password lock
├── pages/              ← Route-level page components
│   ├── Dashboard.jsx   ← Main landing page with overview + charts
│   ├── Transactions.jsx ← List + search + filter + CRUD
│   ├── Analytics.jsx   ← Weekly/Monthly/Yearly tabs with charts
│   ├── CalendarView.jsx ← GitHub-style spend heatmap
│   ├── Goals.jsx       ← Financial goals + progress tracking
│   ├── Reports.jsx     ← Export to PDF/CSV/JSON
│   └── Settings.jsx    ← Theme, budget, password, data management
├── stores/
│   └── useFinanceStore.js ← Zustand central store (THE state of truth)
├── lib/
│   ├── calculations.js ← ALL financial math (50/30/20, ratios, scores, etc.)
│   ├── insights.js     ← Auto-generated financial insights
│   ├── validators.js   ← Zod schemas for form validation
│   ├── seedData.js     ← Default categories, payment methods, budget config
│   ├── iconMap.js      ← String-to-Lucide-component mapping
│   └── utils.js        ← cn(), formatCurrency(), formatDate(), helpers
├── hooks/
│   └── useTheme.js     ← Light/Dark/System theme management
├── App.jsx             ← Router + theme init + lock gate
├── main.jsx            ← Entry point
└── index.css           ← Design system, tokens, safe-area, fonts
```

---

## How Data Flows

### Adding a Transaction
1. User taps FAB (+) → `AddTransactionSheet` opens
2. User fills form → React Hook Form validates via Zod schema
3. On submit → `useFinanceStore.addTransaction(data)` called
4. Zustand `set()` adds to `transactions[]` array
5. `persist` middleware auto-writes to localStorage
6. All subscribed components re-render with new data
7. Dashboard recalculates charts, insights, budget usage

### Budget Calculations
All budget math is in `src/lib/calculations.js` as pure functions:
- `calculateBudgetSplit(salary)` → { needs, wants, savings }
- `calculateBudgetVsActual(transactions, budgetConfig, dateRange)` → [{ type, budget, actual, remaining, percentage }]
- `calculateWeeklyAnalysis(transactions, weeklyLimit, month, year)` → weekly spend vs limit
- `calculateMonthlyScore(totalExpense, salary)` → 1-10 score
- `calculateCategoryBreakdown(transactions, categories, start, end)` → sorted category list

**Rule**: These functions are PURE. No store access, no side effects. Pass data in, get results out.

---

## Key Business Rules

### 50/30/20 Budget
- **Needs** = 50% of salary (rent, transport, bills, health)
- **Wants** = 30% of salary (dining, shopping, entertainment)  
- **Savings** = 20% of salary (investments, emergency fund)
- Each category maps to a type (Need/Want/Saving) via `seedData.js`
- Budget type is auto-set when user picks a category in the add form

### Weekly Limit
- Default ₹10,000/week
- Ratio = (weekSpend / weeklyLimit) × 100
- Color coding: green (<70%), yellow (70-100%), red (>100%)

### Monthly Score
- 1-10 based on `totalExpense / salary` ratio
- 10 = spent ≤60%, 5 = spent ~85%, 1 = spent >100%

---

## Theming

- CSS variables in `src/index.css` (ShadCN format: `--color-*`)
- Dark mode via `.dark` class on `<html>`
- `useTheme()` hook manages: user pref → Zustand → applies class + meta tag
- Three options: Light, Dark, System (auto-detects via `prefers-color-scheme`)

---

## Password Lock

- NOT server-auth. Just a client-side gate.
- Password hashed with `btoa()` (base64, NOT cryptographic)
- Hash stored in `settings.passwordHash` in localStorage
- On app open: if `passwordEnabled && isLocked` → show `LockScreen`
- After correct password: `isLocked` set to `false` for session
- User can enable/disable from Settings

---

## PWA

- `vite-plugin-pwa` generates service worker + manifest
- All assets precached on first load
- Google Fonts cached via runtime caching (CacheFirst)
- Installable via "Add to Home Screen"
- `public/favicon.svg` → app icon
- Configured in `vite.config.js`

---

## Adding New Features

### New Page
1. Create `src/pages/NewPage.jsx`
2. Add lazy import in `src/App.jsx`
3. Add `<Route>` in router
4. Add nav entry in `BottomNav.jsx` or `Sidebar.jsx`

### New Category
Users can't add custom categories from the UI yet. To add default categories, edit `DEFAULT_CATEGORIES` in `src/lib/seedData.js`.

### New Chart
1. Import from `recharts` (BarChart, AreaChart, PieChart, etc.)
2. Wrap in `<ResponsiveContainer>`
3. Style tooltips with `contentStyle` using CSS variables
4. Use semantic colors from design tokens

### New Store Action
1. Add function inside `create(persist(...))` in `useFinanceStore.js`
2. Use `set()` for state updates, `get()` to read current state
3. Arrays: spread immutably → `set({ items: [...get().items, newItem] })`

---

## Common Issues & Fixes

| Issue | Fix |
|---|---|
| Build fails with "unknown option" | ShadCN CLI not needed — components are manual |
| Charts not rendering | Check `ResponsiveContainer` has explicit width/height |
| Theme not applying | Verify `.dark` class on `<html>`, check `useTheme()` is called in `App` |
| Data lost on reload | Check localStorage key `finpilot-storage` exists |
| Safe area not working | Need `viewport-fit=cover` in `<meta viewport>` |

---

## File Size Reference

Production build (gzipped):
- Total JS: ~320KB
- CSS: ~8KB
- Service Worker + manifest included
- All pages are lazy-loaded (code-split)

---

## License & Credits

Built with React, Zustand, Recharts, Tailwind CSS, ShadCN UI, Framer Motion, and Lucide icons.
Business logic derived from an Excel finance tracker using the 50/30/20 budgeting method.
