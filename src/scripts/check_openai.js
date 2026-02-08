import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');

let apiKey = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_OPENAI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
        console.log("✅ API Key loaded: " + apiKey.substring(0, 8) + "...");
    } else {
        console.error("❌ API Key not found in .env");
        process.exit(1);
    }
} catch (err) {
    console.error("❌ Could not read .env file:", err.message);
    process.exit(1);
}

// Minimal JSON prompt to test structure
const SYSTEM_PROMPT = `
You are an AI generating JSON UI instructions.
Return a valid JSON array.
Example: [{"component": "GenerativeTable", "props": {"title": "Test"}}]
`;

function callOpenAI(model) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const req = https.request('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const duration = Date.now() - startTime;
                if (res.statusCode !== 200) {
                    console.log(`❌ [${model}] Failed (${res.statusCode}): ${data}`);
                    resolve(null);
                    return;
                }
                try {
                    const json = JSON.parse(data);
                    const content = json.choices[0].message.content;
                    const parsedContent = JSON.parse(content);

                    console.log(`✅ [${model}] Success in ${duration}ms`);
                    console.log(`   Output: ${JSON.stringify(parsedContent).substring(0, 60)}...`);
                    resolve(duration);
                } catch (e) {
                    console.log(`❌ [${model}] Invalid JSON in ${duration}ms: ${e.message}`);
                    console.log("Raw output:", data);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ [${model}] Network Error: ${e.message}`);
            resolve(null);
        });

        req.write(JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: "Show me leads" }
            ],
            response_format: { type: "json_object" }
        }));
        req.end();
    });
}

async function test() {
    console.log("\n🏎️  Benchmarking OpenAI Models...");
    await callOpenAI("gpt-4o");
    await callOpenAI("gpt-4o-mini");
}

test();
