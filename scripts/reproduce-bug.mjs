// scripts/test-client-ai.mjs

import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
// FIX 1: Import the HTTP transport instead of SSE
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import dotenv from 'dotenv';

dotenv.config();

const origin = process.argv[2] || 'http://localhost:3000';
const userPrompt = "Echo the message 'hello from the client'";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY. Please create a .env file.');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// FIX 2: Use the HTTP transport and connect to the /mcp endpoint
const transport = new StreamableHTTPClientTransport(new URL(`${origin}/mcp`));
const client = new Client({ name: 'mcp-test-client', version: '1.0.0' }, { capabilities: {} });

async function main() {
  try {
    console.log(`🔌 Connecting to: ${origin}/mcp`);
    await client.connect(transport);
    console.log('✅ Connected!');

    const { tools } = await client.listTools();
    console.log('\n🧰 Available Tools:', tools.map(t => t.name).join(', '));

    const openAITools = tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.annotations.description,
        parameters: tool.inputSchema,
      },
    }));

    console.log(`\n🗣️ User Prompt: "${userPrompt}"`);
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that uses tools.' },
        { role: 'user', content: userPrompt },
      ],
      tools: openAITools,
      tool_choice: 'auto',
    });

    const toolCall = chat.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.log('🤷 No tool selected by GPT.');
      return;
    }

    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments);

    console.log(`\n🚀 Invoking tool "${toolName}" with args:`, toolArgs);
    const result = await client.request(toolName, toolArgs);

    console.log('\n✅ Result:\n', result.content[0].text);
  } catch (err) {
    console.error('❌ Error:', err);
  }
  // FIX 3: No client.close() is needed for the HTTP transport
}

main();