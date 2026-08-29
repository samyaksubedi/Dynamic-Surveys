export class ApiResponse<T> {
  readonly success = true;

  constructor(
    readonly statusCode: number,
    readonly data: T,
    readonly message: string,
  ) {}
}

export class ApiError extends Error {
  readonly success = false;

  constructor(
    readonly statusCode: number,
    message: string,
    readonly errors: unknown[] = [],
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors,
      success: this.success,
    };
  }
}
