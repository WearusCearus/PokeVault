const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const db   = require('./db');
const app  = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://pokevault-production-0f04.up.railway.app'
  ]
}));
app.use(express.json());

// DEMO USER
const DEMO_USER_ID = '18cc069b-6518-4a98-8a00-e997448bdf7e';

// AUTH MIDDLEWARE
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.SUPABASE_ANON_KEY
      }
    });

    const user = await response.json();

    if (!user.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();

  } catch (err) {
    res.status(401).json({ error: 'Token verification failed' });
  }
}

// DEMO BLOCK MIDDLEWARE
function blockDemo(req, res, next) {
  if (req.user.id === DEMO_USER_ID) {
    return res.status(403).json({ error: 'Demo account is read-only.' });
  }
  next();
}

// CARDS ROUTES

app.get('/api/cards', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM cards WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cards', requireAuth, blockDemo, async (req, res) => {
  const { name, rarity, current_price, emoji, image } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO cards (name, rarity, current_price, emoji, image, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [name, rarity, current_price || 0, emoji || '🃏', image || '', req.user.id]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Card added!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cards/:id', requireAuth, blockDemo, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM cards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Card deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WISHLIST ROUTES

app.get('/api/wishlist', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM wishlist WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wishlist', requireAuth, blockDemo, async (req, res) => {
  const { name, rarity, current_price, priority, emoji, image } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO wishlist (name, rarity, current_price, priority, emoji, image, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [name, rarity, current_price || 0, priority || 'low', emoji || '🃏', image || '', req.user.id]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Added to wishlist!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/wishlist/:id', requireAuth, blockDemo, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM wishlist WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Removed from wishlist!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/wishlist/:id/priority', requireAuth, blockDemo, async (req, res) => {
  const { priority } = req.body;
  try {
    await db.query(
      'UPDATE wishlist SET priority = $1 WHERE id = $2 AND user_id = $3',
      [priority, req.params.id, req.user.id]
    );
    res.json({ message: 'Priority updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STATS ROUTE

app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const collectionResult = await db.query(`
      SELECT
        COUNT(*)                        AS total_cards,
        COALESCE(SUM(current_price), 0) AS total_value,
        COALESCE(AVG(current_price), 0) AS avg_price
      FROM cards WHERE user_id = $1
    `, [req.user.id]);

    const wishlistResult = await db.query(
      'SELECT COUNT(*) AS total_wishlist FROM wishlist WHERE user_id = $1',
      [req.user.id]
    );

    const topCardsResult = await db.query(`
      SELECT name, current_price, image, rarity, emoji
      FROM cards WHERE user_id = $1
      ORDER BY current_price DESC LIMIT 5
    `, [req.user.id]);

    const recentResult = await db.query(`
      SELECT name, current_price, image, rarity, emoji, created_at
      FROM cards WHERE user_id = $1
      ORDER BY created_at DESC LIMIT 5
    `, [req.user.id]);

    res.json({
      totalCards:    parseInt(collectionResult.rows[0].total_cards),
      totalValue:    parseFloat(collectionResult.rows[0].total_value).toFixed(2),
      avgPrice:      parseFloat(collectionResult.rows[0].avg_price).toFixed(2),
      totalWishlist: parseInt(wishlistResult.rows[0].total_wishlist),
      topCards:      topCardsResult.rows,
      recentCards:   recentResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PRICE REFRESH
app.post('/api/refresh-prices', requireAuth, blockDemo, async (req, res) => {
  try {
    const settingResult = await db.query(
      "SELECT value, updated_at FROM settings WHERE key = 'last_price_refresh'"
    );

    const lastRefresh = settingResult.rows[0]?.updated_at;
    const now         = new Date();
    const hoursSince  = lastRefresh
      ? (now - new Date(lastRefresh)) / (1000 * 60 * 60)
      : 999;

    if (hoursSince < 24) {
      return res.json({
        message: `Prices are up to date. Next refresh in ${(24 - hoursSince).toFixed(1)} hours.`,
        skipped: true
      });
    }

    const cardsResult    = await db.query('SELECT id, name FROM cards WHERE user_id = $1', [req.user.id]);
    const wishlistResult = await db.query('SELECT id, name FROM wishlist WHERE user_id = $1', [req.user.id]);

    const allItems = [
      ...cardsResult.rows.map(r => ({ ...r, table: 'cards' })),
      ...wishlistResult.rows.map(r => ({ ...r, table: 'wishlist' })),
    ];

    let updated = 0;

    for (const item of allItems) {
      try {
        const url = `https://www.pokemonpricetracker.com/api/v2/cards?search=${encodeURIComponent(item.name)}&limit=1`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${process.env.POKEMON_PRICE_API_KEY}` }
        });
        const json = await response.json();

        if (json.data && json.data.length > 0) {
          const price = json.data[0].prices?.market || 0;
          const image = json.data[0].imageCdnUrl200 || json.data[0].imageUrl || '';
          await db.query(
            `UPDATE ${item.table} SET current_price = $1, image = $2 WHERE id = $3 AND user_id = $4`,
            [price, image, item.id, req.user.id]
          );
          updated++;
        }
      } catch (err) {
        console.log(`Could not update ${item.name}:`, err.message);
      }
    }

    await db.query(
      `UPDATE settings SET value = 'completed', updated_at = NOW() WHERE key = 'last_price_refresh'`
    );

    res.json({ message: `Updated ${updated} of ${allItems.length} cards`, skipped: false });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LAST REFRESH

app.get('/api/last-refresh', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT updated_at FROM settings WHERE key = 'last_price_refresh'"
    );
    res.json({ last_refresh: result.rows[0]?.updated_at || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEARCH

app.get('/api/search', requireAuth, async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Please provide a card name' });

  try {
    const url = `https://www.pokemonpricetracker.com/api/v2/cards?search=${encodeURIComponent(name)}&limit=12`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${process.env.POKEMON_PRICE_API_KEY}` }
    });
    const json = await response.json();

    if (!json.data || !Array.isArray(json.data)) {
      return res.status(503).json({ error: json.message || 'API unavailable.' });
    }

    const cards = json.data.map(card => ({
      api_id:        card.id,
      name:          card.name,
      rarity:        card.rarity         || 'Unknown',
      set_name:      card.setName        || 'Unknown Set',
      image:         card.imageCdnUrl200 || card.imageUrl || '',
      current_price: card.prices?.market || 0,
    }));

    res.json(cards);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`✅ PokéVault API running at http://localhost:${PORT}`);
});