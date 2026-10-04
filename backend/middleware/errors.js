const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(ApiError.notFound('No route matches ' + req.method + ' ' + req.originalUrl));
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const body = {
    success: false,
    message: status === 500 ? 'Internal server error.' : err.message,
  };
  if (err.errors) body.errors = err.errors;

  if (status === 500) {
    console.error('[error]', req.method, req.originalUrl, '-', err);
  }

  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };