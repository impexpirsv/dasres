import { AppError } from "./errors";

export function parseId(
  value: string,
  label = "id",
): number {
  const id = Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new AppError(
      `Invalid ${label}.`,
      400,
    );
  }

  return id;
}