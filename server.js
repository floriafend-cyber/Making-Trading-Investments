const express = require('express');
const bodyParser = require('body-parser');
const Binance = require('binance-api-node').default;
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const client = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
});

// Place Spot Trade
app.post('/trade', async (req, res) => {
  const { symbol, side, quantity } = req.body;
  try {
    const order = await client.order({
      symbol,
      side,
      type: 'MARKET',
      quantity,
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Market Data
app.get('/price/:symbol', async (req, res) => {
  const price = await client.prices({ symbol: req.params.symbol });
  res.json(price);
});

app.listen(3001, () => console.log('Backend running on port 3001'));

