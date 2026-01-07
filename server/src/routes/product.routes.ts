import { Router } from 'express';
import { createProductController, ProductController } from '../controllers';

export function createProductRoutes(controller?: ProductController): Router {
  const router = Router();
  const ctrl = controller || createProductController();

  router.get('/products', (req, res) => ctrl.getAll(req, res));
  router.get('/date-range', (req, res) => ctrl.getDateRange(req, res));

  return router;
}
