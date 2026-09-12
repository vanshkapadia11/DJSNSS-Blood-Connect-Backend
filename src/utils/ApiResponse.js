/**
 * Standardized success response shape so every endpoint in the API
 * returns the same envelope: { success, message, data, meta }
 */
class ApiResponse {
  constructor(statusCode, message = 'Success', data = null, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }

  send(res) {
    return res.status(this.statusCode).json(this);
  }
}

module.exports = ApiResponse;
