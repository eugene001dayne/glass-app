import Anthropic from "@anthropic-ai/sdk";

// This tells Next.js this route streams data back instead of returning all at once
export const runtime = "edge";

// The Claude system prompt — this is how we tell Claude to behave like Glass expects
const SYSTEM_PROMPT = `You are Glass — a visual AI agent. When given a task, you break it into clear steps and execute them.

For every step you take, respond with a JSON object on its own line in this exact format:
{"type":"step","label":"short action title","sub":"one line detail about what you are doing","state":"active"}

When a step finishes, send:
{"type":"step","label":"same title","sub":"same detail","state":"done","diff":["+ file or change made"]}

When you need to explain something in plain English, send:
{"type":"explain","text":"plain English explanation of what is happening and why"}

When the whole task is complete, send:
{"type":"done","summary":"what was accomplished"}

Rules:
- Keep labels short (3-5 words)
- Keep sub to one clear sentence  
- diff array shows actual files created or lines changed
- Always think step by step
- Never output anything outside of these JSON objects
- Real code and real file contents go inside diff arrays as strings`;

export async function POST(request) {
  // Read the task the user sent from the frontend
  const { task, history = [] } = await request.json();

  // Create Anthropic client — reads ANTHROPIC_API_KEY from environment variables
  const client = new Anthropic();

  // Build the message history — previous steps become context for Claude
  const messages = [
    ...history,
    { role: "user", content: task },
  ];

  // Create a streaming response — data flows back to the browser as Claude thinks
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Call Claude with streaming enabled
        const response = await client.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages,
          stream: true,
        });

        let buffer = "";

        // As Claude generates text, we receive it in chunks
        for await (const chunk of response) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            buffer += chunk.delta.text;

            // Try to parse complete JSON objects from the buffer
            const lines = buffer.split("\n");
            buffer = lines.pop(); // keep incomplete line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                // Validate it's real JSON before sending
                JSON.parse(trimmed);
                // Send the line to the frontend
                controller.enqueue(new TextEncoder().encode(trimmed + "\n"));
              } catch {
                // Not valid JSON yet — skip
              }
            }
          }
        }

        // Flush anything left in the buffer
        if (buffer.trim()) {
          try {
            JSON.parse(buffer.trim());
            controller.enqueue(new TextEncoder().encode(buffer.trim() + "\n"));
          } catch {
            // ignore incomplete
          }
        }

        controller.close();
      } catch (error) {
        // Send error back to frontend as a JSON step card
        const errCard = JSON.stringify({
          type: "step",
          label: "something went wrong",
          sub: error.message,
          state: "rolled",
        });
        controller.enqueue(new TextEncoder().encode(errCard + "\n"));
        controller.close();
      }
    },
  });

  // Return the stream with correct headers so browser knows it's streaming
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}