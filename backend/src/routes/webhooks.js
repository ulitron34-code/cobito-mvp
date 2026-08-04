const express = require('express');
const { NODE_ENV, WHATSAPP_WEBHOOK_SECRET } = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { httpError } = require('../utils/errors');
const { handleInboundMessage } = require('../services/chatbot');

const router = express.Router();

function verifyWebhook(req) {
  if (!WHATSAPP_WEBHOOK_SECRET && NODE_ENV !== 'production') return;
  const provided = req.get('x-cobito-webhook-secret') || req.query.secret;
  if (!WHATSAPP_WEBHOOK_SECRET || provided !== WHATSAPP_WEBHOOK_SECRET) {
    throw httpError(401, 'Webhook no autorizado');
  }
}

router.post('/whatsapp', asyncHandler(async (req, res) => {
  verifyWebhook(req);

  const payload = normalizeProviderPayload(req.body);
  if (!payload.body) throw httpError(400, 'Mensaje vacio');

  const result = await handleInboundMessage(payload);
  res.json({ ok: true, ...result });
}));

router.get('/whatsapp', (req, res) => {
  if (req.query['hub.challenge']) {
    return res.send(req.query['hub.challenge']);
  }

  res.json({ ok: true, service: 'cobito-whatsapp-webhook' });
});

function normalizeProviderPayload(body) {
  const twilioBody = body.Body ? {
    from: body.From,
    body: body.Body,
    provider: 'twilio',
    providerMessageId: body.MessageSid
  } : null;

  const metaMessage = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const metaBody = metaMessage ? {
    from: metaMessage.from,
    body: metaMessage.text?.body || '',
    provider: 'meta',
    providerMessageId: metaMessage.id
  } : null;

  return {
    ...body,
    ...(twilioBody || metaBody || {}),
    body: twilioBody?.body || metaBody?.body || body.body || body.message || '',
    from: twilioBody?.from || metaBody?.from || body.from || body.phone || '',
    facturaId: body.facturaId,
    folio: body.folio
  };
}

module.exports = router;