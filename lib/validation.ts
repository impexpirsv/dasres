import { AppError } from "./errors";

export function parseId(value: string, label = "id") {
  const id = Number(value);

  if (Number.isNaN(id)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }

  return id;
}