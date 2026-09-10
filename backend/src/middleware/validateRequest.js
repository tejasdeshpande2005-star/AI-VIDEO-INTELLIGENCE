function validateRequest(schema, source = 'query') {
  return (req, res, next) => {
    try {
      req.validated = schema.parse(req[source]);
      next();
    } catch (error) {
      next(error); // Pass to error handler, it handles ZodError
    }
  };
}

module.exports = validateRequest;
