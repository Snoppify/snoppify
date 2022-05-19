/**
 * An assortment of custom util types
 */

type RequireSome<T, TRequired extends keyof T = keyof T> = Partial<
  Pick<T, Exclude<keyof T, TRequired>>
> &
  Required<Pick<T, TRequired>>;
