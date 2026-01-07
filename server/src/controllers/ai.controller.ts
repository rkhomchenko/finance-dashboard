import { Request, Response } from 'express';
import { IAIService, createAIService } from '../ai';

interface ChatContext {
  dateRange?: { startDate: string; endDate: string };
  products?: Array<{ id: string; name: string }>;
}

export class AIController {
  constructor(
    private aiService: IAIService = createAIService()
  ) {}

  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { question, context } = this.parseBody(req);

      if (!question) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Question is required and must be a string'
        });
        return;
      }

      const messages = await this.aiService.processQuestion(question, context);

      if (messages.length === 1) {
        const msg = messages[0];
        if (msg.type === 'chart' && msg.chartConfig) {
          res.json({
            id: crypto.randomUUID(),
            type: 'chart',
            title: msg.title,
            chartConfig: msg.chartConfig
          });
        } else {
          res.json({
            id: crypto.randomUUID(),
            type: 'text',
            content: msg.content
          });
        }
      } else {
        res.json({
          id: crypto.randomUUID(),
          type: 'multiple',
          messages: messages.map(msg => ({
            id: crypto.randomUUID(),
            ...msg
          }))
        });
      }
    } catch (error) {
      this.handleError(res, error, 'AI processing failed');
    }
  }

  async chatStream(req: Request, res: Response): Promise<void> {
    const { question, context } = this.parseBody(req);

    if (!question) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Question is required and must be a string'
      });
      return;
    }

    await this.aiService.processQuestionStream(question, context, res);
  }

  private parseBody(req: Request): { question: string | null; context: ChatContext } {
    const { question, context } = req.body || {};
    return {
      question: typeof question === 'string' ? question.trim() : null,
      context: context || {}
    };
  }

  private handleError(res: Response, error: unknown, defaultMessage: string): void {
    console.error(defaultMessage, error);
    res.status(500).json({
      error: defaultMessage,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export function createAIController(service?: IAIService): AIController {
  return new AIController(service || createAIService());
}
