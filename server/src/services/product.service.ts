import { IProductRepository, createProductRepository } from '../repositories';
import { Product, DateRange } from '../types';
import { IMetricRepository, createMetricRepository } from '../repositories';

export interface IProductService {
  getAllProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getDateRange(): Promise<DateRange>;
}

export class ProductService implements IProductService {
  constructor(
    private productRepo: IProductRepository = createProductRepository(),
    private metricRepo: IMetricRepository = createMetricRepository()
  ) {}

  async getAllProducts(): Promise<Product[]> {
    return this.productRepo.findAll();
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.productRepo.findById(id);
  }

  async getDateRange(): Promise<DateRange> {
    return this.metricRepo.getDateRange();
  }
}

export function createProductService(
  productRepo?: IProductRepository,
  metricRepo?: IMetricRepository
): IProductService {
  return new ProductService(
    productRepo || createProductRepository(),
    metricRepo || createMetricRepository()
  );
}
