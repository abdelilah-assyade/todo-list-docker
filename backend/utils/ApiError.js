class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    if (errors) this.errors = errors;
  }

  static badRequest(message, errors) {
    return new ApiError(400, message, errors);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
}

module.exports = ApiError;