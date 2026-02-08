const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!API_KEY) {
    console.error("Missing VITE_OPENAI_API_KEY in .env file");
}

export interface UIInstruction {
    id: string;
    component: 'GenerativeTable' | 'GenerativeChart' | 'GenerativeKPI' | 'GenerativeForm' | 'ActionGuard' | 'SystemMessage';
    props: any;
    message?: string;
}

const SYSTEM_PROMPT = `
You are "Tambo", an AI output engine.
Your sole purpose is to output valid JSON for a UI renderer.

OUTPUT FORMAT:
Return a JSON Object with a "ui" key containing an Array of Component Instructions.
Example:
{
  "ui": [
    {
      "component": "GenerativeTable",
      "props": {
        "title": "Active Leads",
        "dataContext": "leads",
        "filter": { "key": "status", "value": "New" }
      },
      "message": "Here are the new leads."
    }
  ]
}

AVAILABLE COMPONENTS:
1. GenerativeTable (props: title, dataContext: 'leads'|'users'|'revenue', filter, sortBy)
2. GenerativeChart (props: title, type: 'line'|'bar'|'area', dataKey: 'revenue'|'leads', color)
3. GenerativeKPI (props: label, value, trend, trendLabel, context: 'positive'|'negative')
4. GenerativeForm (props: title, onSubmitIntent, fields: [{name, label, type}])
5. ActionGuard (props: title, description, impactMetrics)
6. SystemMessage (props: {}, message: string) - Use this for general chat responses.
`;

export async function processIntent(input: string): Promise<UIInstruction[]> {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Optimized for speed (approx 2x faster than 4o)
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `User Input: "${input}"` }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || response.statusText);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        console.log("AI Raw Output:", content); // Debug logging

        let instructions: any = JSON.parse(content);

        // Normalize structure to always be UIInstruction[]
        if (instructions.ui && Array.isArray(instructions.ui)) {
            instructions = instructions.ui;
        } else if (Array.isArray(instructions)) {
            // Keep as is
        } else {
            // Wrap single object
            instructions = [instructions];
        }

        // Add IDs if missing
        return instructions.map((i: any, idx: number) => ({
            ...i,
            id: i.id || `gen-${Date.now()}-${idx}`
        })) as UIInstruction[];

    } catch (error: any) {
        console.error("OpenAI API Error:", error);
        return [{
            id: 'error-fallback',
            component: 'SystemMessage',
            props: {},
            message: `Brain Error: ${error.message}. Check console for details.`
        }];
    }
}
