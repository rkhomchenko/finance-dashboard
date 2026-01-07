import OpenAI from 'openai';

export const RESPONSE_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "ai_cfo_response",
    strict: true,
    schema: {
      type: "object",
      properties: {
        messages: {
          type: "array",
          description: "Array of response messages - can include text and/or charts",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["text", "chart"],
                description: "Type of message"
              },
              content: {
                type: ["string", "null"],
                description: "Text content (for text messages, null for charts)"
              },
              title: {
                type: ["string", "null"],
                description: "Chart title (for chart messages, null for text)"
              },
              chartConfig: {
                anyOf: [
                  {
                    type: "object",
                    properties: {
                      chartType: {
                        type: "string",
                        enum: ["bar", "line", "horizontalBar"]
                      },
                      query: {
                        type: "object",
                        properties: {
                          groupBy: {
                            type: "string",
                            enum: ["month", "product"]
                          },
                          metric: {
                            type: "string",
                            enum: ["revenue", "expenses", "profit", "margin", "cac", "ltv"]
                          },
                          startDate: {
                            type: ["string", "null"],
                            description: "Start date in YYYY-MM-DD format"
                          },
                          endDate: {
                            type: ["string", "null"],
                            description: "End date in YYYY-MM-DD format"
                          },
                          productIds: {
                            anyOf: [
                              { type: "array", items: { type: "string" } },
                              { type: "null" }
                            ]
                          },
                          sortDirection: {
                            type: ["string", "null"],
                            enum: ["asc", "desc", null]
                          }
                        },
                        required: ["groupBy", "metric", "startDate", "endDate", "productIds", "sortDirection"],
                        additionalProperties: false
                      }
                    },
                    required: ["chartType", "query"],
                    additionalProperties: false
                  },
                  { type: "null" }
                ]
              }
            },
            required: ["type", "content", "title", "chartConfig"],
            additionalProperties: false
          }
        }
      },
      required: ["messages"],
      additionalProperties: false
    }
  }
};

export const OPENAI_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "query_metrics",
      description: "Query financial metrics from the database. Use this to get data for charts or analysis.",
      parameters: {
        type: "object",
        properties: {
          groupBy: {
            type: "string",
            enum: ["month", "product"],
            description: "How to aggregate the data. Use 'month' for time-series, 'product' for product comparisons."
          },
          metric: {
            type: "string",
            enum: ["revenue", "expenses", "profit", "margin", "cac", "ltv"],
            description: "Which metric to query"
          },
          startDate: {
            type: "string",
            description: "Start date in YYYY-MM-DD format (optional)"
          },
          endDate: {
            type: "string",
            description: "End date in YYYY-MM-DD format (optional)"
          },
          productIds: {
            type: "array",
            items: { type: "string" },
            description: "Filter by specific product IDs: enterprise, professional, starter, consulting"
          }
        },
        required: ["groupBy", "metric"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_products",
      description: "Get the list of all available products",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_date_range",
      description: "Get the available date range in the dataset",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];
