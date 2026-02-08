import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');

let apiKey = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
        console.log("✅ API Key loaded from .env: " + apiKey.substring(0, 8) + "...");
    } else {
        console.error("❌ API Key not found in .env");
        process.exit(1);
    }
} catch (err) {
    console.error("❌ Could not read .env file:", err.message);
    process.exit(1);
}

async function testModels() {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Updated models list based on user input
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];

    console.log("\n🧪 Testing Models...");

    for (const modelName of models) {
        process.stdout.write(`   Checking [${modelName}]... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            const response = await result.response;
            console.log(`✅ WORKING`);
            console.log(`\n🎉 SUCCESS! Please use '${modelName}' in your code.`);
            return;
        } catch (error) {
            console.log(`❌ FAILED`);
            console.error(`      Error: ${error.message.split('[')[0]}`); // simplify error
            if (error.response) {
                console.error(`      Status: ${error.response.status}`);
            }
        }
    }

    console.log("\n❌ ALL models failed. This indicates an issue with the API Key or Google Cloud Project settings.");
}

testModels();
