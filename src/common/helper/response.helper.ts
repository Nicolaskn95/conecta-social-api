export class ResponseHelper {
  static success<T>(
    data: T,
    message = 'Requisição bem-sucedida',
    statusCode = 200
  ) {
    return {
      code: statusCode,
      success: true,
      message,
      data,
    };
  }

  static error(message: string, statusCode = 400) {
    return {
      code: statusCode,
      success: false,
      message,
      data: null,
    };
  }
}
