import { AppError } from "../errors";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PaginationInput = {
  readonly page?: number;
  readonly pageSize?: number;
};

export type Pagination = {
  readonly page: number;
  readonly pageSize: number;
  readonly skip: number;
  readonly take: number;
};

export type PaginatedResult<T> = {
  readonly items: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
  };
};

function assertPositiveInteger(
  value: number,
  fieldName: string,
): void {
  if (!Number.isInteger(value) || value < 1) {
    throw AppError.validation(
      `${fieldName} must be a positive integer.`,
      { field: fieldName, value },
    );
  }
}

export function normalizePagination(
  input: PaginationInput = {},
): Pagination {
  const page = input.page ?? DEFAULT_PAGE;
  const requestedPageSize =
    input.pageSize ?? DEFAULT_PAGE_SIZE;

  assertPositiveInteger(page, "page");
  assertPositiveInteger(
    requestedPageSize,
    "pageSize",
  );

  const pageSize = Math.min(
    requestedPageSize,
    MAX_PAGE_SIZE,
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function createPaginatedResult<T>(
  items: readonly T[],
  totalItems: number,
  pagination: Pick<
    Pagination,
    "page" | "pageSize"
  >,
): PaginatedResult<T> {
  if (!Number.isInteger(totalItems) || totalItems < 0) {
    throw new RangeError(
      "totalItems must be a non-negative integer.",
    );
  }

  const totalPages =
    totalItems === 0
      ? 0
      : Math.ceil(
          totalItems / pagination.pageSize,
        );

  return {
    items,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
      totalPages,
      hasNextPage:
        pagination.page < totalPages,
      hasPreviousPage:
        pagination.page > 1,
    },
  };
}
