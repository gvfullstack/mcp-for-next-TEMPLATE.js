This repository demonstrates a critical bug in the vercel-labs/mcp-for-next.js template. After a fresh clone and installation, the server fails to process any tool invocation request, returning a 400 Bad Request with a JSON-RPC "Parse error."

The debugging process has confirmed the following:

The error is not environment-specific, as it fails both locally (Windows/Node.js v20) and when deployed to Vercel.

The error occurs with both transport methods: SSEClientTransport (to /sse) and StreamableHTTPClientTransport (to /mcp).

Basic MCP communication works (client.listTools() succeeds), but any tool invocation (client.request()) fails.

The error persists even when using the unmodified, pristine code from the template.

The error payload from the server ({"0":"e", ...}) suggests a fundamental serialization/deserialization bug within the @vercel/mcp-adapter, where it incorrectly processes the request payload.

Steps to Reproduce
Here are the exact steps for the maintainers to reproduce the error.

Clone the repository:

git clone https://github.com/YOUR_USERNAME/mcp-for-next.js.git
cd mcp-for-next.js
Install dependencies:

pnpm install
Set up environment variable:
Create a .env file in the project root and add your OpenAI API key:

OPENAI_API_KEY="sk-..."
Start the server:
In a terminal, run the development server:

pnpm dev
Run the client script:
In a second terminal, run the test script:

node scripts/reproduce-bug.mjs
Observe the error:
The client script will connect and list the tools successfully, but the final client.request() will fail with the 400 Parse Error in the terminal.