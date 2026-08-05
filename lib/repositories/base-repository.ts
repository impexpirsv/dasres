export type RepositoryId = string | number;

export type PageRequest = {
  readonly page: number;
  readonly pageSize: number;
};

export type PageResult<T> = {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
};

export interface ReadRepository<
  TEntity,
  TId extends RepositoryId = RepositoryId,
> {
  findById(id: TId): Promise<TEntity | null>;
  exists(id: TId): Promise<boolean>;
}

export interface WriteRepository<
  TEntity,
  TCreateInput,
  TUpdateInput,
  TId extends RepositoryId = RepositoryId,
> {
  create(input: TCreateInput): Promise<TEntity>;
  update(
    id: TId,
    input: TUpdateInput,
  ): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}

export interface Repository<
  TEntity,
  TCreateInput,
  TUpdateInput,
  TId extends RepositoryId = RepositoryId,
> extends ReadRepository<TEntity, TId>,
    WriteRepository<
      TEntity,
      TCreateInput,
      TUpdateInput,
      TId
    > {}
