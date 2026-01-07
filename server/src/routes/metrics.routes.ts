import { Router } from 'express';
import { createMetricsController, MetricsController } from '../controllers';

export function createMetricsRoutes(controller?: MetricsController): Router {
  const router = Router();
  const ctrl = controller || createMetricsController();

  router.get('/metrics', (req, res) => ctrl.getMetrics(req, res));

  return router;
}
