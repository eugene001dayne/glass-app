use futures_util::StreamExt;
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

// ── agent state ──────────────────────────────────────────────────────────────

struct AgentHandle {
    cancel_tx: Option<tokio::sync::oneshot::Sender<()>>,
}

impl Default for AgentHandle {
    fn default() -> Self {
        Self { cancel_tx: None }
    }
}

pub type AgentState = Arc<Mutex<AgentHandle>>;

// ── system prompt (mirrors route.js exactly) ─────────────────────────────────

const SYSTEM_PROMPT: &str = r#"You are Glass — a visual AI agent. When given a task, you break it into clear steps and execute them.

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
- Real code and real file contents go inside diff arrays as strings"#;

// ── commands ──────────────────────────────────────────────────────────────────

#[tauri::command]
async fn run_agent(
    task: String,
    history: Vec<Value>,
    app: AppHandle,
    state: State<'_, AgentState>,
) -> Result<(), String> {
    // cancel any running agent first
    {
        let mut h = state.lock().unwrap();
        if let Some(tx) = h.cancel_tx.take() {
            let _ = tx.send(());
        }
    }

    let (cancel_tx, mut cancel_rx) = tokio::sync::oneshot::channel::<()>();
    {
        state.lock().unwrap().cancel_tx = Some(cancel_tx);
    }

    // read API key from environment
    let api_key = std::env::var("ANTHROPIC_API_KEY")
        .map_err(|_| "ANTHROPIC_API_KEY not set — add it to your system environment variables".to_string())?;

    // build message history
    let mut messages: Vec<Value> = history;
    messages.push(json!({ "role": "user", "content": task }));

    let body = json!({
        "model": "claude-sonnet-4-5",
        "max_tokens": 4096,
        "system": SYSTEM_PROMPT,
        "messages": messages,
        "stream": true,
    });

    // make the streaming request
    let client = reqwest::Client::new();
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        let _ = app.emit("step-card", json!({
            "type": "step",
            "label": "API error",
            "sub": format!("{} — {}", status, body),
            "state": "rolled"
        }));
        return Err(format!("API error: {}", status));
    }

    let mut stream = response.bytes_stream();

    // two-level buffer:
    // sse_buf  — accumulates raw bytes into SSE lines
    // json_buf — accumulates Claude's text output, parsed for complete JSON objects
    let mut sse_buf  = String::new();
    let mut json_buf = String::new();

    loop {
        tokio::select! {
            _ = &mut cancel_rx => {
                let _ = app.emit("agent-cancelled", ());
                break;
            }

            chunk = stream.next() => {
                match chunk {
                    None => {
                        // stream ended — flush anything remaining in json_buf
                        let remaining = json_buf.trim().to_string();
                        if !remaining.is_empty() {
                            if let Ok(card) = serde_json::from_str::<Value>(&remaining) {
                                let _ = app.emit("step-card", card);
                            }
                        }
                        let _ = app.emit("agent-stream-done", ());
                        break;
                    }

                    Some(Err(e)) => {
                        let _ = app.emit("step-card", json!({
                            "type": "step",
                            "label": "stream error",
                            "sub": e.to_string(),
                            "state": "rolled"
                        }));
                        break;
                    }

                    Some(Ok(bytes)) => {
                        sse_buf.push_str(&String::from_utf8_lossy(&bytes));

                        // process every complete SSE line
                        while let Some(pos) = sse_buf.find('\n') {
                            let line = sse_buf[..pos].trim_end_matches('\r').to_string();
                            sse_buf = sse_buf[pos + 1..].to_string();

                            // only care about data: lines
                            if let Some(data) = line.strip_prefix("data: ") {
                                if data == "[DONE]" { continue; }

                                if let Ok(event) = serde_json::from_str::<Value>(data) {
                                    // extract text delta from content_block_delta events
                                    if event["type"] == "content_block_delta"
                                        && event["delta"]["type"] == "text_delta"
                                    {
                                        if let Some(text) = event["delta"]["text"].as_str() {
                                            json_buf.push_str(text);

                                            // emit raw text to terminal panel
                                            let _ = app.emit("terminal-line", json!({
                                                "cls": "out",
                                                "text": text.trim()
                                            }));

                                            // parse complete JSON lines out of json_buf
                                            while let Some(nl) = json_buf.find('\n') {
                                                let candidate = json_buf[..nl].trim().to_string();
                                                json_buf = json_buf[nl + 1..].to_string();
                                                if candidate.is_empty() { continue; }

                                                if let Ok(card) = serde_json::from_str::<Value>(&candidate) {
                                                    let _ = app.emit("step-card", card);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

#[tauri::command]
async fn cancel_agent(state: State<'_, AgentState>) -> Result<(), String> {
    let mut h = state.lock().unwrap();
    if let Some(tx) = h.cancel_tx.take() {
        let _ = tx.send(());
    }
    Ok(())
}

// ── app entry ─────────────────────────────────────────────────────────────────

pub fn run() {
    tauri::Builder::default()
        .manage(Arc::new(Mutex::new(AgentHandle::default())) as AgentState)
        .invoke_handler(tauri::generate_handler![run_agent, cancel_agent])
        .run(tauri::generate_context!())
        .expect("error while running Glass");
}