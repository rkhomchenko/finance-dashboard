import { Request, Response } from 'express';
import { IProductService, createProductService } from '../services';

export class ProductController {
  constructor(
    private productService: IProductService = createProductService()
  ) {}

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const products = await this.productService.getAllProducts();
      res.json({ products });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch products');
    }
  }

  async getDateRange(_req: Request, res: Response): Promise<void> {
    try {
      const dateRange = await this.productService.getDateRange();
      res.json(dateRange);
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch date range');
    }
  }

  private handleError(res: Response, error: unknown, defaultMessage: string): void {
    console.error(defaultMessage, error);
    res.status(500).json({
      error: defaultMessage,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export function createProductController(service?: IProductService): ProductController {
  return new ProductController(service || createProductService());
}
