import OpenAI from 'openai';
import { Response } from 'express';
import { getOpenAIClient } from './client';
import { SYSTEM_PROMPT } from './prompts';
import { OPENAI_TOOLS, RESPONSE_SCHEMA } from './schemas';
import { createToolExecutor, ToolExecutor } from './tools';

interface ChatContext {
  dateRange?: { startDate: string; endDate: string };
  products?: Array<{ id: string; name: string }>;
}

interface ChatMessage {
  type: 'text' | 'chart';
  content?: string | null;
  title?: string | null;
  chartConfig?: { chartType: string; query: object; id?: string } | null;
}

interface StructuredResponse {
  messages: ChatMessage[];
}

interface StreamEvent {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'text' | 'chart' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolArgs?: object;
  toolResult?: object;
  chartConfig?: object;
  title?: string;
}

const MAX_ITERATIONS = 10;
const MODEL = 'gpt-4o';

export interface IAIService {
  processQuestion(question: string, context?: ChatContext): Promise<ChatMessage[]>;
  processQuestionStream(question: string, context: ChatContext, res: Response): Promise<void>;
}

export class AIService implements IAIService {
  constructor(
    private toolExecutor: ToolExecutor = createToolExecutor()
  ) {}

  async processQuestion(question: string, context: ChatContext = {}): Promise<ChatMessage[]> {
    const messages = this.buildInitialMessages(question, context);

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await getOpenAIClient().chat.completions.create({
        model: MODEL,
        messages,
        tools: OPENAI_TOOLS,
        tool_choice: 'auto',
        temperature: 0.7
      });

      const assistantMessage = response.choices[0].message;

      if (assistantMessage.tool_calls?.length) {
        messages.push(assistantMessage);
        await this.executeToolCalls(assistantMessage.tool_calls, messages);
      } else {
        return this.getStructuredResponse(messages);
      }
    }

    return [{ type: 'text', content: 'Reached maximum iterations.', title: null, chartConfig: null }];
  }

  async processQuestionStream(
    question: string,
    context: ChatContext = {},
    res: Response
  ): Promise<void> {
    this.setupSSE(res);
    const sendEvent = (event: StreamEvent) => res.write(`data: ${JSON.stringify(event)}\n\n`);

    try {
      const messages = this.buildInitialMessages(question, context);
      let hasMoreToolCalls = true;
      let iterations = 0;

      while (hasMoreToolCalls && iterations < MAX_ITERATIONS) {
        iterations++;
        sendEvent({ type: 'thinking', content: `Processing (iteration ${iterations})...` });

        const { content, toolCalls } = await this.streamCompletion(messages);

        if (toolCalls.length > 0) {
          messages.push({ role: 'assistant', content: content || null, tool_calls: toolCalls });
          await this.executeToolCallsWithEvents(toolCalls, messages, sendEvent);
        } else {
          hasMoreToolCalls = false;
          sendEvent({ type: 'thinking', content: 'Generating response...' });
          await this.sendStructuredResponse(messages, sendEvent);
        }
      }

      if (iterations >= MAX_ITERATIONS) {
        sendEvent({ type: 'error', content: 'Reached maximum iterations.' });
      }

      sendEvent({ type: 'done' });
    } catch (error) {
      console.error('AI streaming error:', error);
      sendEvent({ type: 'error', content: 'Error processing request.' });
      sendEvent({ type: 'done' });
    } finally {
      res.end();
    }
  }

  private buildInitialMessages(
    question: string,
    context: ChatContext
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    let userMessage = question;
    if (context.dateRange) {
      userMessage += `\n\n[Dashboard date range: ${context.dateRange.startDate} to ${context.dateRange.endDate}]`;
    }

    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ];
  }

  private setupSSE(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  }

  private async streamCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  ): Promise<{ content: string; toolCalls: ToolCall[] }> {
    const stream = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      messages,
      tools: OPENAI_TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      stream: true
    });

    let content = '';
    const toolCalls: ToolCall[] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
        content += delta.content;
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.index !== undefined) {
            if (!toolCalls[tc.index]) {
              toolCalls[tc.index] = { id: '', type: 'function', function: { name: '', arguments: '' } };
            }
            if (tc.id) toolCalls[tc.index].id = tc.id;
            if (tc.function?.name) toolCalls[tc.index].function.name = tc.function.name;
            if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
          }
        }
      }
    }

    return { content, toolCalls };
  }

  private async executeToolCalls(
    toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  ): Promise<void> {
    for (const toolCall of toolCalls) {
      if (toolCall.type === 'function') {
        const args = this.parseToolArgs(toolCall.function.arguments);
        const result = await this.toolExecutor.execute(toolCall.function.name, args);
        messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) });
      }
    }
  }

  private async executeToolCallsWithEvents(
    toolCalls: ToolCall[],
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    sendEvent: (event: StreamEvent) => void
  ): Promise<void> {
    for (const toolCall of toolCalls) {
      const args = this.parseToolArgs(toolCall.function.arguments);

      sendEvent({
        type: 'tool_call',
        toolName: toolCall.function.name,
        toolArgs: args,
        content: `Calling ${toolCall.function.name}...`
      });

      const result = await this.toolExecutor.execute(toolCall.function.name, args);

      sendEvent({
        type: 'tool_result',
        toolName: toolCall.function.name,
        toolResult: result,
        content: `Got results from ${toolCall.function.name}`
      });

      messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) });
    }
  }

  private parseToolArgs(argsString: string): Record<string, unknown> {
    try {
      return JSON.parse(argsString || '{}');
    } catch {
      console.error('Failed to parse tool arguments:', argsString);
      return {};
    }
  }

  private async getStructuredResponse(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  ): Promise<ChatMessage[]> {
    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      messages,
      response_format: RESPONSE_SCHEMA,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    try {
      const parsed = JSON.parse(content) as StructuredResponse;
      return this.addChartIds(parsed.messages);
    } catch {
      return [{ type: 'text', content, title: null, chartConfig: null }];
    }
  }

  private async sendStructuredResponse(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    sendEvent: (event: StreamEvent) => void
  ): Promise<void> {
    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      messages,
      response_format: RESPONSE_SCHEMA,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return;

    try {
      const parsed = JSON.parse(content) as StructuredResponse;

      for (const msg of parsed.messages) {
        if (msg.type === 'text' && msg.content) {
          sendEvent({ type: 'text', content: msg.content });
        } else if (msg.type === 'chart' && msg.chartConfig) {
          sendEvent({
            type: 'chart',
            title: msg.title || 'Chart',
            chartConfig: { id: crypto.randomUUID(), ...msg.chartConfig }
          });
        }
      }
    } catch (error) {
      console.error('Failed to parse structured response:', error);
      sendEvent({ type: 'text', content });
    }
  }

  private addChartIds(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(msg => {
      if (msg.type === 'chart' && msg.chartConfig) {
        return {
          ...msg,
          chartConfig: { ...msg.chartConfig, id: crypto.randomUUID() } as ChatMessage['chartConfig']
        };
      }
      return msg;
    });
  }
}

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export function createAIService(toolExecutor?: ToolExecutor): IAIService {
  return new AIService(toolExecutor || createToolExecutor());
}
