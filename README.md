# Command — Personal Dashboard

Your personal OS. Live Stripe revenue, Google Fit health data, AI goal planner, prioritised daily tasks.

## Deploy to Vercel (5 minutes)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "init"
gh repo create command-dashboard --private --push
```

### 2. Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

### 3. Add environment variables
In Vercel project settings → Environment Variables:

| Variable | Value | Required |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` | For live revenue |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | For AI goal planner |
| `VITE_GOOGLE_CLIENT_ID` | From Google Console | For Google Fit |
| `GOOGLE_CLIENT_SECRET` | From Google Console | For Google Fit |
| `VITE_APP_URL` | `https://yourdomain.com` | For Google Fit OAuth redirect |

### 4. Set up Google Fit (optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Fitness API**
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorised redirect URI: `https://yourdomain.com/auth/google`
5. Copy Client ID and Secret to Vercel env vars

### 5. Set up Stripe (optional)

Just add your `STRIPE_SECRET_KEY` — the app automatically reads your subscriptions and charges.

### 6. Add to home screen (mobile PWA)

iOS: Safari → Share → Add to Home Screen  
Android: Chrome → Menu → Add to Home Screen

---

## Local development

```bash
npm install
npm run dev
```

Create `.env.local`:
```
VITE_GOOGLE_CLIENT_ID=your_id
VITE_APP_URL=http://localhost:3000
```

For Stripe/planner serverless functions locally, use [Vercel CLI](https://vercel.com/docs/cli):
```bash
npm i -g vercel
vercel dev
```
