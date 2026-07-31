const express = require('express');
const bcryptjs = require('bcryptjs');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { validate } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');
const { httpError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/register', validate('register'), asyncHandler(async (req, res) => {
  const { email, password, empresa } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const exists = await db.oneOrNone('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (exists) throw httpError(409, 'Email ya registrado');

  const passwordHash = await bcryptjs.hash(password, 12);
  const user = await db.one(
    'INSERT INTO users (id, email, password_hash, empresa, plan, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, empresa, plan, status',
    [uuidv4(), normalizedEmail, passwordHash, empresa, 'BASIC', 'active']
  );

  res.status(201).json({ user, token: generateToken(user.id, user.email) });
}));

router.post('/login', validate('login'), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await db.oneOrNone(
    'SELECT id, email, password_hash, empresa, plan, status FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  if (!user) throw httpError(401, 'Credenciales inválidas');
  if (user.status !== 'active') throw httpError(403, 'Cuenta inactiva');

  const passwordOk = await bcryptjs.compare(password, user.password_hash);
  if (!passwordOk) throw httpError(401, 'Credenciales inválidas');

  res.json({
    user: { id: user.id, email: user.email, empresa: user.empresa, plan: user.plan, status: user.status },
    token: generateToken(user.id, user.email)
  });
}));

module.exports = router;
