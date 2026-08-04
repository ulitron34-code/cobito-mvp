const Joi = require('joi');

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    empresa: Joi.string().min(2).max(255).required()
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  cliente: Joi.object({
    nombre: Joi.string().min(2).max(255).required(),
    rfc: Joi.string().allow('', null).max(13),
    email: Joi.string().email().allow('', null),
    telefono: Joi.string().allow('', null).max(20),
    notas: Joi.string().allow('', null).max(2000)
  }),
  factura: Joi.object({
    clienteId: uuid.required(),
    folio: Joi.string().allow('', null).max(80),
    monto: Joi.number().min(0).required(),
    moneda: Joi.string().length(3).default('MXN'),
    fechaEmision: Joi.date().iso().required(),
    fechaVencimiento: Joi.date().iso().required(),
    concepto: Joi.string().allow('', null).max(500)
  }),
  facturaEstado: Joi.object({
    estado: Joi.string().valid('PENDIENTE', 'VENCIDA', 'PROMESA', 'PAGADA', 'CANCELADA').required()
  }),
  importFacturas: Joi.object({
    facturas: Joi.array().items(Joi.object({
      clienteNombre: Joi.string().min(2).max(255).required(),
      rfc: Joi.string().allow('', null).max(13),
      email: Joi.string().email().allow('', null),
      telefono: Joi.string().allow('', null).max(20),
      folio: Joi.string().allow('', null).max(80),
      monto: Joi.number().min(0).required(),
      fechaEmision: Joi.date().iso().required(),
      fechaVencimiento: Joi.date().iso().required(),
      concepto: Joi.string().allow('', null).max(500)
    })).min(1).required()
  }),
  enviarRecordatorio: Joi.object({
    canal: Joi.string().valid('WHATSAPP', 'EMAIL', 'SMS', 'LLAMADA').required(),
    templateId: Joi.string().allow('', null).max(80)
  }),
  promesa: Joi.object({
    fechaPrometida: Joi.date().iso().required(),
    monto: Joi.number().min(0).required(),
    notas: Joi.string().allow('', null).max(2000)
  }),
  pago: Joi.object({
    monto: Joi.number().min(0).required(),
    canal: Joi.string().allow('', null).max(50),
    referencia: Joi.string().allow('', null).max(255)
  }),
  templateMensaje: Joi.object({
    nombre: Joi.string().min(2).max(120).required(),
    canal: Joi.string().valid('WHATSAPP', 'EMAIL', 'SMS', 'LLAMADA').required(),
    contenido: Joi.string().min(10).max(2000).required()
  })
};

function validate(schemaName, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schemas[schemaName].validate(req[source], {
      abortEarly: true,
      stripUnknown: true
    });

    if (error) return next(error);
    req[source] = value;
    next();
  };
}

module.exports = { validate };