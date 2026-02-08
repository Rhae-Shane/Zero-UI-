import OpenAI from 'openai';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!API_KEY) {
    console.error("Missing VITE_OPENAI_API_KEY in .env file");
}

const openai = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true // Allowed for client-side demo
});

export type IntentType = 'VIEW_LIST' | 'ANALYZE_METRIC' | 'COMPARE_METRIC';

export interface Intent {
    type: IntentType;
    entity: string;
    metric?: string;
    timeframe?: string;
}

// Dynamic prompt is constructed in classifyIntent function

interface TableSchema {
    name: string;
    columns: string[];
}

export async function classifyIntent(input: string, apiKey?: string, schema?: TableSchema[], businessContext?: string): Promise<Intent> {
    try {
        const keyToUse = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
        if (!keyToUse) throw new Error("Missing OpenAI API Key");

        const client = new OpenAI({
            apiKey: keyToUse,
            dangerouslyAllowBrowser: true,
        });

        // Dynamic System Prompt Construction
        let schemaDescription = "AVAILABLE TABLES (Entities):";
        if (schema && schema.length > 0) {
            schemaDescription += "\n" + schema.map(t => `- "${t.name}" (Columns: ${t.columns.join(', ')})`).join('\n');
        } else {
            // Fallback for demo / pre-connection
            schemaDescription += `
- "users"
- "orders"
- "subscriptions"
- "trades"
- "payments"`;
        }

        const DYNAMIC_PROMPT = `
You are an intent classifier for a business analytics dashboard.
User inputs will be natural language queries about business data.
Map them to ONE of these intents:

1. VIEW_LIST: User wants to see a list of items (e.g., "Show recent users", "List all orders").
2. ANALYZE_METRIC: User wants a single number or trend (e.g., "What is the churn rate?", "Total revenue").
3. COMPARE_METRIC: User wants to compare data (e.g., "Compare this month vs last month", "Revenue by plan").

${schemaDescription}

${businessContext ? `USER CONTEXT: The user describes their data as: "${businessContext}". Use this to map their query to the correct entity.` : ''}

RULES:
- ONLY use the entities listed above.
- If user mentions a concept from their context description, map it to the matching entity.
- If the user asks for "revenue", map to the most relevant table containing revenue/amount.
- For "ANALYZE_METRIC", the "metric" field MUST be one of: "count", "sum", "avg". Default to "count" if unspecified.

Return a JSON object with:
- type: The IntentType
- entity: The valid entity name from the list above.
- metric: The specific metric (count, sum, avg)
- timeframe: Any time constraints (last 30 days, today, etc.)

Example Input: "Show me daily signups for the last week"
Example Output: { "type": "ANALYZE_METRIC", "entity": "users", "metric": "count", "timeframe": "last 7 days" }
`;

        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: DYNAMIC_PROMPT },
                { role: "user", content: `User Input: "${input}"` }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content returned from OpenAI");

        return JSON.parse(content) as Intent;
    } catch (error) {
        console.error("OpenAI Intent Error:", error);
        throw error;
    }
}
// Remove static export { openai }; as it's no longer the single source of truth


export { openai };
