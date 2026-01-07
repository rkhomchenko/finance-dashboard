import * as fs from 'fs/promises';
import * as path from 'path';
import { Dataset, Product, Metric } from '../types';

export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getProducts(): Promise<Product[]>;
  getMetrics(): Promise<Metric[]>;
  getProductById(id: string): Promise<Product | null>;
  getMetricsByDateRange(startDate?: string, endDate?: string): Promise<Metric[]>;
  getMetricsByProductIds(productIds: string[]): Promise<Metric[]>;
}

export class JsonDatabase implements IDatabase {
  private dataset: Dataset | null = null;
  private dataPath: string;
  private connected: boolean = false;

  constructor(dataPath?: string) {
    this.dataPath = dataPath || path.join(__dirname, '..', '..', 'dataset.json');
  }

  async connect(): Promise<void> {
    try {
      const rawData = await fs.readFile(this.dataPath, 'utf-8');
      this.dataset = JSON.parse(rawData);
      this.connected = true;
      console.log(`✓ Database connected: ${this.dataset?.metrics.length} metrics, ${this.dataset?.products.length} products`);
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect to database: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.dataset = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.dataset !== null;
  }

  private ensureConnected(): void {
    if (!this.isConnected()) {
      throw new Error('Database not connected');
    }
  }

  async getProducts(): Promise<Product[]> {
    this.ensureConnected();
    return Promise.resolve([...this.dataset!.products]);
  }

  async getMetrics(): Promise<Metric[]> {
    this.ensureConnected();
    return Promise.resolve([...this.dataset!.metrics]);
  }

  async getProductById(id: string): Promise<Product | null> {
    this.ensureConnected();
    const product = this.dataset!.products.find(p => p.id === id);
    return Promise.resolve(product || null);
  }

  async getMetricsByDateRange(startDate?: string, endDate?: string): Promise<Metric[]> {
    this.ensureConnected();
    let metrics = [...this.dataset!.metrics];

    if (startDate) {
      metrics = metrics.filter(m => m.date >= startDate);
    }
    if (endDate) {
      metrics = metrics.filter(m => m.date <= endDate);
    }

    return Promise.resolve(metrics);
  }

  async getMetricsByProductIds(productIds: string[]): Promise<Metric[]> {
    this.ensureConnected();
    const metrics = this.dataset!.metrics.filter(m => productIds.includes(m.productId));
    return Promise.resolve(metrics);
  }
}

let databaseInstance: IDatabase | null = null;

export function getDatabase(): IDatabase {
  if (!databaseInstance) {
    databaseInstance = new JsonDatabase();
  }
  return databaseInstance;
}

export function setDatabase(db: IDatabase): void {
  databaseInstance = db;
}
