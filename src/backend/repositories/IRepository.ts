export abstract class IRepository {
  abstract get(idOrPath: string | string[]): Promise<Record<string, unknown> | null>;
  abstract getAll(): Promise<Array<Record<string, unknown>>>;
  abstract create(data: Record<string, unknown>, idOrPath?: string | string[] | null): Promise<Record<string, unknown>>;
  abstract update(idOrPath: string | string[], data: Record<string, unknown>): Promise<Record<string, unknown>>;
  abstract delete(idOrPath: string | string[]): Promise<void>;
}
