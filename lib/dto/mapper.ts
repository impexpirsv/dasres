export interface Mapper<TSource, TDestination> {
  map(source: TSource): TDestination;
}

export type MapperFunction<
  TSource,
  TDestination,
> = (source: TSource) => TDestination;

export function mapCollection<
  TSource,
  TDestination,
>(
  source: readonly TSource[],
  mapper: MapperFunction<
    TSource,
    TDestination
  >,
): TDestination[] {
  return source.map(mapper);
}

export function mapNullable<
  TSource,
  TDestination,
>(
  source: TSource | null | undefined,
  mapper: MapperFunction<
    TSource,
    TDestination
  >,
): TDestination | null {
  return source == null
    ? null
    : mapper(source);
}
