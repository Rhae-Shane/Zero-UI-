import OpenAI from 'openai';

export interface UIInstruction {
    id: string;
    component: 'GenerativeTable' | 'GenerativeChart' | 'GenerativeKPI' | 'GenerativeInsight' | 'ActionGuard';
    props: any;
    message?: string;
}

const SYSTEM_PROMPT = `
You are "Tambo", an AI output engine.
Your sole purpose is to output valid JSON for a UI renderer based on business data intents.

OUTPUT FORMAT:
Return a JSON Object with a "ui" key containing an Array of Component Instructions.

AVAILABLE COMPONENTS:
1. GenerativeTable
   - props: title (string), data (array of objects), columns (array of {key, label})
   - Use for list views.

2. GenerativeChart
   - props: title (string), type ('line'|'bar'|'pie'), data (array), xKey (string), yKey (string), color (string)
   - Use for trends and comparisons.

3. GenerativeKPI
   - props: label (string), value (string/number), trend (number, optional), trendLabel (string, optional), context ('positive'|'negative'|'neutral')
   - Use for single metrics.

4. GenerativeInsight
   - props: title (string), content (string), severity ('info'|'warning'|'success')
   - Use for textual analysis or explanations.

RULES:
- Do NOT make up data. You will receive data from an adapter.
- If data is missing, return a GenerativeInsight explaining why.
- Choose the BEST visualization for the data.
`;

export async function determineUI(intent: any, data: any, apiKey?: string): Promise<UIInstruction[]> {
    try {
        const keyToUse = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
        if (!keyToUse) throw new Error("Missing OpenAI API Key");

        const client = new OpenAI({
            apiKey: keyToUse,
            dangerouslyAllowBrowser: true
        });

        const prompt = `
        Context:
        Intent: ${JSON.stringify(intent)}
        Data: ${JSON.stringify(data).substring(0, 5000)} // Truncate if too large

        Decide the best UI to render this data.
        `;

        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" }
        });

        const text = completion.choices[0].message.content;
        console.log("Tambo Raw Output:", text);

        let instructions: any = JSON.parse(text || "{}");

        // Normalize structure
        if (instructions.ui && Array.isArray(instructions.ui)) {
            instructions = instructions.ui;
        } else if (Array.isArray(instructions)) {
            // Keep as is
        } else {
            instructions = [instructions];
        }

        return instructions.map((i: any, idx: number) => ({
            ...i,
            id: i.id || `gen-${Date.now()}-${idx}`
        })) as UIInstruction[];

    } catch (error: any) {
        console.error("Tambo Error:", error);
        return [{
            id: 'error-fallback',
            component: 'GenerativeInsight',
            props: {
                title: "Error",
                content: `Failed to generate UI: ${error.message}`,
                severity: "warning"
            },
            message: "Something went wrong."
        }];
    }
}
