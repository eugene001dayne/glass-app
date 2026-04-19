import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

const SYSTEM_PROMPT = `You are Glass — a visual AI agent that executes tasks immediately.

CRITICAL RULES:
1. NEVER ask the user clarifying questions. Ever. Make smart assumptions and start working immediately.
2. ALWAYS respond ONLY with JSON objects — one per line. No plain text. No explanations outside JSON.
3. If a task is ambiguous, pick the most reasonable interpretation and execute it.
4. Every single response must be a valid JSON object on its own line.

RESPONSE FORMAT — use exactly these four types:

When starting a step:
{"type":"step","label":"short title 3-5 words","sub":"one sentence describing what you are doing","state":"active"}

When finishing a step (always pair with the active step above):
{"type":"step","label":"exact same title","sub":"exact same sub","state":"done","diff":["+ filename.ext","+ key content line","+ another content line"]}

When the output is a file with real content, put the FULL file contents in the diff:
{"type":"step","label":"create article file","sub":"writing complete article to file","state":"done","diff":["+ anthropic_article.md: # Title\\n\\n## Section\\n\\nFull content here..."]}

When sharing a plain english insight (use sparingly):
{"type":"explain","text":"one sentence plain english explanation"}

When completely done:
{"type":"done","summary":"one sentence of what was accomplished"}

TASK EXECUTION RULES:
- Break every task into 3-6 concrete steps
- Each step must produce something real — a file, content, a structure
- The LAST step must always create the final output file with FULL content in the diff
- For articles/documents: write the complete text, not a summary
- For code: write the complete working code, not a skeleton
- For research: gather and present the actual information
- Filename must include the correct extension: .md for articles, .html for web pages, .py for Python, .js for JavaScript
- NEVER skip steps, NEVER leave placeholders, NEVER say "content here"
- Always complete the full task from start to finish in one session

ASSUMPTIONS TO MAKE (never ask about these):
- Article length: 800-1200 words unless told otherwise
- Code: fully functional, no placeholders
- Style: clean and professional
- Audience: general unless obvious from context
- Format: markdown for documents, semantic HTML for web pages`;

export async function POST(request) {
  const { task, history = [] } = await request.json();

  const client = new Anthropic();

  const messages = [
    ...history,
    { role: "user", content: task },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => {
        controller.enqueue(new TextEncoder().encode(JSON.stringify(obj) + "\n"));
      };

      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages,
          stream: true,
        });

        let buffer = "";

        for await (const chunk of response) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            buffer += chunk.delta.text;

            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              // try to parse as JSON first
              try {
                const parsed = JSON.parse(trimmed);
                // valid JSON card — send it
                controller.enqueue(new TextEncoder().encode(trimmed + "\n"));
              } catch {
                // not JSON — Claude broke format and sent plain text
                // wrap it as an explain card so user can see it
                if (trimmed.length > 10) {
                  send({ type: "explain", text: trimmed });
                }
              }
            }
          }
        }

        // flush buffer
        if (buffer.trim()) {
          try {
            JSON.parse(buffer.trim());
            controller.enqueue(new TextEncoder().encode(buffer.trim() + "\n"));
          } catch {
            if (buffer.trim().length > 10) {
              send({ type: "explain", text: buffer.trim() });
            }
          }
        }

        controller.close();
      } catch (error) {
        send({
          type: "step",
          label: "something went wrong",
          sub: error.message,
          state: "rolled",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}