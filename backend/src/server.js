const express = require('express');
const cors = require('cors');
const { PORT, FRONTEND_URL } = require('./config/env');

const app = express();

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cobito-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/facturas', require('./routes/facturas'));
app.use('/api/cobranza', require('./routes/cobranza'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  if (err.isJoi) {
    return res.status(400).json({ error: err.details[0].message });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: err.publicMessage || 'Error del servidor' });
});

app.listen(PORT, () => {
  console.log(`COBITO API running on http://localhost:${PORT}`);
});
