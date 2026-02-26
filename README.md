# PokéFolio

A full stack Pokémon TCG collection tracker with real-time market prices, wishlist management, and multi-user authentication.

**Live Demo:** [thepokefolio.vercel.app](https://thepokefolio.vercel.app) — click "Try the Demo" to explore without signing up.

---

## Features

- **Collection Tracker** — add, delete, search, and sort your cards by name, price, or rarity
- **Live Market Prices** — real TCGPlayer market data via PokemonPriceTracker API with 24-hour caching
- **Real Card Images** — official artwork pulled directly from TCGPlayer CDN
- **Wishlist** — track cards you want with high, med, and low priority levels
- **Card Search** — search the full Pokémon TCG database and add cards in one click
- **Dashboard** — total collection value, most valuable cards, and recently added at a glance
- **Authentication** — email/password and Google OAuth via Supabase Auth
- **Multi-user** — each account is completely private with row-level security
- **Demo Mode** — read-only demo account to test features

---

## Tech Stack

**Frontend**
- Angular 20 (standalone components, signals, computed)
- TypeScript
- RxJS Observables

**Backend**
- Node.js + Express
- PostgreSQL (Supabase)
- Supabase Auth (JWT verification)

**APIs**
- PokemonPriceTracker API (live TCGPlayer prices)
- Supabase Auth (Google OAuth + email)

**Deployment**
- Frontend: Vercel
- Backend: Railway
- Database: Supabase

---

## Getting Started

### Prerequisites

- Node.js v20+
- Angular CLI (`npm install -g @angular/cli`)
- Supabase account (free tier)
- PokemonPriceTracker API key (free tier)

### 1. Clone the repo

```bash
git clone https://github.com/WearusCearus/PokeVault.git
cd PokeVault
```

### 2. Set up the database

Run the following SQL in your Supabase SQL Editor:

```sql
CREATE TABLE cards (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  rarity        VARCHAR(30)  NOT NULL,
  current_price DECIMAL(10,2) DEFAULT 0.00,
  emoji         VARCHAR(10)  DEFAULT '🃏',
  image         VARCHAR(500) DEFAULT '',
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wishlist (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  rarity        VARCHAR(30)  NOT NULL,
  current_price DECIMAL(10,2) DEFAULT 0.00,
  priority      VARCHAR(10)  DEFAULT 'low',
  emoji         VARCHAR(10)  DEFAULT '🃏',
  image         VARCHAR(500) DEFAULT '',
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings (key, value, updated_at)
VALUES ('last_price_refresh', 'never', NOW() - INTERVAL '25 hours');
```

Enable Row Level Security:

```sql
ALTER TABLE cards    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cards"    ON cards    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);
```

### 3. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file:

```
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
POKEMON_PRICE_API_KEY=your_pokemonpricetracker_key
PORT=3000
```

Start the backend:

```bash
npm run dev
```

### 4. Set up the frontend

```bash
cd frontend
npm install
```

Update `src/app/services/supabase.ts` with your Supabase URL and anon key:

```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

Start the frontend:

```bash
ng serve
```

Open **http://localhost:4200**

---

## Project Structure

```
PokeVault/
├── backend/
│   ├── server.js          Express API with all routes
│   ├── db.js              PostgreSQL connection pool
│   └── .env               Environment variables (not committed)
└── frontend/
    └── src/app/
        ├── services/
        │   ├── card.ts        All API calls + interfaces
        │   ├── supabase.ts    Auth service
        │   └── demo.ts        Demo mode flag
        ├── guards/
        │   └── auth-guard.ts  Protects authenticated routes
        └── components/
            ├── home/          Landing page
            ├── auth/          Login + signup
            ├── demo/          Demo entry page
            ├── dashboard/     Stats overview
            ├── collection/    Card collection
            ├── wishlist/      Wishlist with priorities
            └── search/        TCG card search
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/cards` | Get all cards for current user |
| POST | `/api/cards` | Add a new card |
| DELETE | `/api/cards/:id` | Delete a card |
| GET | `/api/wishlist` | Get all wishlist items |
| POST | `/api/wishlist` | Add to wishlist |
| DELETE | `/api/wishlist/:id` | Remove from wishlist |
| PATCH | `/api/wishlist/:id/priority` | Update priority |
| GET | `/api/stats` | Dashboard stats |
| GET | `/api/search?name=` | Search TCG cards |
| POST | `/api/refresh-prices` | Refresh prices from API |
| GET | `/api/last-refresh` | Last refresh timestamp |

All routes require a valid Supabase JWT in the `Authorization` header.

---

## Environment Variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `POKEMON_PRICE_API_KEY` | PokemonPriceTracker API key |
| `PORT` | Server port (default: 3000) |

---

## Demo Account

A read-only demo account is available at `/demo`. It is enforced at both the frontend and backend levels — write operations return a 403 for the demo user ID regardless of how they authenticate.

---

## License

MIT
