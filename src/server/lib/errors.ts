/** Domain error the UI is allowed to show verbatim (message is a plain string). */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "CONFLICT"
      | "VALIDATION"
      | "BAD_REQUEST" = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(message = "Not found"): never {
  throw new AppError(message, "NOT_FOUND");
}

export function forbidden(message = "Forbidden"): never {
  throw new AppError(message, "FORBIDDEN");
}

export function conflict(message: string): never {
  throw new AppError(message, "CONFLICT");
}
