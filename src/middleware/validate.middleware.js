// ── Joi validation middleware factory ─────────────────────
// Usage: router.post('/', validate(myJoiSchema), controller)

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly:    false,  // collect ALL errors, not just the first
      stripUnknown: true,    // remove fields not in schema
      convert:      true,    // coerce types where possible (e.g. "123" → 123)
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field:   d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace req.body with the sanitised + coerced value
    req.body = value;
    next();
  };
};

module.exports = validate;
