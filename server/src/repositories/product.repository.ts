import { getDatabase, IDatabase } from '../database';
import { Product } from '../types';

export interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
}

export class ProductRepository implements IProductRepository {
  private db: IDatabase;

  constructor(database?: IDatabase) {
    this.db = database || getDatabase();
  }

  async findAll(): Promise<Product[]> {
    return this.db.getProducts();
  }

  async findById(id: string): Promise<Product | null> {
    return this.db.getProductById(id);
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    const products = await this.db.getProducts();
    return products.filter(p => ids.includes(p.id));
  }
}

export function createProductRepository(db?: IDatabase): IProductRepository {
  return new ProductRepository(db);
}
