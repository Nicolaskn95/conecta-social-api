export class ResponseHelper {
  static success<T>(
    data: T,
    message = 'Requisição bem-sucedida',
    statusCode = 200
  ) {
    return {
      status_code: statusCode,
      success: true,
      message,
      data,
    };
  }

  static error(message: string, statusCode = 400) {
    return {
      status_code: statusCode,
      success: false,
      message,
      data: null,
    };
  }
}
