function sanitizeError(err) {
  if (process.env.NODE_ENV === "production") {
    return "Error interno del servidor";
  }
  return err.message;
}

module.exports = { sanitizeError };
