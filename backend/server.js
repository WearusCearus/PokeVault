const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const db   = require('./db');
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());


// Fetch all cards
app.get('/api/cards', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cards ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new card
app.post('/api/cards', async (req, res) => {
  const { name, rarity, current_price, emoji, image } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO cards (name, rarity, current_price, emoji, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, rarity, current_price || 0, emoji || '🃏', image || '']
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Card added!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a card
app.delete('/api/cards/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM cards WHERE id = $1', [req.params.id]);
    res.json({ message: 'Card deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// WISHLIST ROUTES

app.get('/api/wishlist', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM wishlist ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wishlist', async (req, res) => {
  const { name, rarity, current_price, priority, emoji, image } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO wishlist (name, rarity, current_price, priority, emoji, image)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [name, rarity, current_price || 0, priority || 'low', emoji || '🃏', image || '']
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Added to wishlist!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/wishlist/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM wishlist WHERE id = $1', [req.params.id]);
    res.json({ message: 'Removed from wishlist!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PRICE REFRESH ROUTE
// Goes through every card in the collection and wishlist,
// searches the PokemonPriceTracker API for each one,
// and updates the price in Supabase

app.post('/api/refresh-prices', async (req, res) => {
  try {

    const settingResult = await db.query(
      "SELECT value, updated_at FROM settings WHERE key = 'last_price_refresh'"
    );

    const lastRefresh = settingResult.rows[0]?.updated_at;
    const now         = new Date();
    const hoursSince  = lastRefresh
      ? (now - new Date(lastRefresh)) / (1000 * 60 * 60)
      : 999;

    console.log(`Hours since last refresh: ${hoursSince.toFixed(1)}`);

    if (hoursSince < 24) {
      return res.json({
        message: `Prices are up to date. Next refresh available in ${(24 - hoursSince).toFixed(1)} hours.`,
        skipped: true
      });
    }

    const cardsResult    = await db.query('SELECT id, name FROM cards');
    const wishlistResult = await db.query('SELECT id, name FROM wishlist');

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

        console.log(`${item.name}:`, json.data ? `${json.data.length} results` : 'NO DATA', json.error || '');

        if (json.data && json.data.length > 0) {
          const price = json.data[0].prices?.market || 0;
          const image = json.data[0].imageCdnUrl200 || json.data[0].imageUrl || '';

          await db.query(
            `UPDATE ${item.table} SET current_price = $1, image = $2 WHERE id = $3`,
            [price, image, item.id]
          );

          updated++;
        }
      } catch (err) {
        console.log(`Could not update ${item.name}:`, err.message);
      }
    }

    await db.query(
      `UPDATE settings SET value = 'completed', updated_at = NOW()
       WHERE key = 'last_price_refresh'`
    );

    res.json({ message: `Updated ${updated} of ${allItems.length} cards`, skipped: false });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// SEARCH ROUTE

app.get('/api/search', async (req, res) => {
  const { name } = req.query;

  if (!name) return res.status(400).json({ error: 'Please provide a card name' });

  try {
    const url = `https://www.pokemonpricetracker.com/api/v2/cards?search=${encodeURIComponent(name)}&limit=12`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.POKEMON_PRICE_API_KEY}`
      }
    });

    const json = await response.json();

    // Guard against rate limit or error responses
    if (!json.data || !Array.isArray(json.data)) {
      console.log('API error response:', json);
      return res.status(503).json({
        error: json.message || 'API unavailable. Daily rate limit may be exceeded.'
      });
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
    console.log('Search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/last-refresh', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT updated_at FROM settings WHERE key = 'last_price_refresh'"
    );
    res.json({ last_refresh: result.rows[0]?.updated_at || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// START SERVER
app.listen(PORT, () => {
  console.log(`✅ PokéVault API running at http://localhost:${PORT}`);
});