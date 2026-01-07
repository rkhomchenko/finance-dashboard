import { Router } from 'express';
import { createAIController, AIController } from '../controllers';

export function createAIRoutes(controller?: AIController): Router {
  const router = Router();
  const ctrl = controller || createAIController();

  router.post('/ai/chat', (req, res) => ctrl.chat(req, res));
  router.post('/ai/chat/stream', (req, res) => ctrl.chatStream(req, res));

  return router;
}
