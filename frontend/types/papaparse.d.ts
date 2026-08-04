declare module 'papaparse' {
  export type ParseError = { message: string; row?: number; code?: string; type?: string };
  export type ParseResult<T> = { data: T[]; errors: ParseError[]; meta: { fields?: string[] } };
  export function parse<T = unknown>(input: string, config: Record<string, unknown>): ParseResult<T>;
}