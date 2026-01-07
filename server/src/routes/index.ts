import { Router } from 'express';
import { createProductRoutes } from './product.routes';
import { createMetricsRoutes } from './metrics.routes';
import { createAIRoutes } from './ai.routes';

export function createRouter(): Router {
  const router = Router();

  router.use(createProductRoutes());
  router.use(createMetricsRoutes());
  router.use(createAIRoutes());

  return router;
}

export { createProductRoutes } from './product.routes';
export { createMetricsRoutes } from './metrics.routes';
export { createAIRoutes } from './ai.routes';
