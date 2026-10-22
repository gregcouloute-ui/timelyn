import { RepositoryError } from "@/lib/data/repository";

export type ServiceErrorCode = "not_found" | "forbidden" | "conflict" | "invalid" | "unavailable";

/** An expected failure with a message that is safe to show to the person. */
export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export const forbidden = (message = "You don't have permission to do that.") => new ServiceError("forbidden", message);
export const notFound = (message = "We couldn't find that.") => new ServiceError("not_found", message);

/** Turns any thrown error into a message suitable for the interface. */
export function describeError(error: unknown): string {
  if (error instanceof ServiceError) return error.message;
  if (error instanceof RepositoryError && error.code !== "unavailable") return error.message;
  console.error(error);
  return "Something went wrong on our side and nothing was saved. Try again in a moment.";
}
