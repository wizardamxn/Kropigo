export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors: any[];

  constructor(
    statusCode: number,
    message: string,
    errors: any[] = [],
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
