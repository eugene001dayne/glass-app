"use client";

import { useState, useRef, useEffect } from "react";

const EXAMPLES = [
  "Build a landing page for my bakery called Golden Crumb",
  "Create a Python script that organises my downloads folder by file type",
  "Set up a portfolio site with an about page and contact form",
];

function StepCard({ card, isDark, onDownload }) {
  const cardBg = {
    done:     isDark ? "bg-green-950/20  border-green-800/40"  : "bg-green-50  border-green-200",
    active:   isDark ? "bg-orange-950/20 border-orange-600/50" : "bg-orange-50 border-orange-300",
    waiting:  isDark ? "bg-white/[0.02]  border-white/8"       : "bg-white     border-black/10",
    rolled:   isDark ? "bg-red-950/20    border-red-800/40"    : "bg-red-50    border-red-200",
    approved: isDark ? "bg-green-950/20  border-green-700/50"  : "bg-green-50  border-green-200",
  }[card.state] || "";

  const labelColor   = isDark ? "text-white/90" : "text-black/80";
  const subColor     = isDark ? "text-white/45" : "text-black/50";
  const explainColor = isDark ? "text-white/50" : "text-black/50";
  const ctxColor     = isDark ? "text-white/25" : "text-black/30";

  const pillStyle = {
    done:     isDark ? "bg-green-950  text-green-400  border border-green-800/50"  : "bg-green-100  text-green-700  border border-green-300",
    active:   isDark ? "bg-orange-950 text-orange-400 border border-orange-700/50" : "bg-orange-100 text-orange-700 border border-orange-300",
    waiting:  isDark ? "bg-white/5    text-white/30   border border-white/10"      : "bg-black/5    text-black/40   border border-black/12",
    rolled:   isDark ? "bg-red-950    text-red-400    border border-red-800/50"    : "bg-red-100    text-red-700    border border-red-300",
    approved: isDark ? "bg-green-950  text-green-400  border border-green-800/50"  : "bg-green-100  text-green-700  border border-green-300",
  }[card.state] || "";

  const pillText = { done:"done", active:"working now", waiting:"waiting", rolled:"rolled back", approved:"approved" }[card.state];

  // find real filename in diff
  const cardFilename = (() => {
    if (!card.diff) return null;
    for (const line of card.diff) {
      if (!line.startsWith("+")) continue;
      const m = line.slice(2).match(/^([\w\-. ]+\.(md|html|htm|py|js|ts|css|json|txt|sh|jsx|tsx))/i);
      if (m) return m[1].trim();
    }
    return null;
  })();

  // clean diff into pure content — strip + prefix and filename: prefix
  const cardContent = card.diff
    ? card.diff
        .filter(l => l.startsWith("+") && l.length > 1)
        .map(l => l.slice(2).replace(/^[\w\-. ]+\.(md|html|htm|py|js|ts|css|json|txt|sh|jsx|tsx):\s*/i, ""))
        .join("\n").trim()
    : "";

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 transition-all duration-200 ${cardBg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StateIcon state={card.state} isDark={isDark} />
          <span className={`text-sm font-medium ${labelColor}`}>{card.label}</span>
        </div>
        {card.state === "done" && cardFilename && cardContent.length > 50 && (
          <button
            onClick={() => onDownload(cardContent, cardFilename)}
            className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
              isDark
                ? "border-white/10 text-white/40 hover:border-orange-600/40 hover:text-orange-400"
                : "border-black/10 text-black/40 hover:border-orange-400/40 hover:text-orange-600"
            }`}
          >
            ↓ download
          </button>
        )}
      </div>
      {card.sub && <p className={`text-xs pl-7 leading-relaxed ${subColor}`}>{card.sub}</p>}
      <div className={`text-[11px] px-2.5 py-0.5 rounded-full w-fit ml-7 ${pillStyle}`}>{pillText}</div>
      {card.diff && (
        <div className="ml-7 bg-[#0d0d0f] rounded-lg p-2.5 font-mono text-[11px] leading-relaxed border border-white/8">
          {card.diff.map((line, i) => (
            <div key={i} className={line.startsWith("+") ? "text-green-400" : line.startsWith("-") ? "text-red-400" : ctxColor}>{line}</div>
          ))}
        </div>
      )}
      {card.explain && (
        <div className="ml-7 border-l-2 border-orange-500/60 pl-3">
          <p className={`text-[11px] leading-relaxed ${explainColor}`}>{card.explain}</p>
        </div>
      )}
    </div>
  );
}

function StateIcon({ state, isDark }) {
  if (state === "active") return (
    <div className="w-5 h-5 rounded-full bg-orange-950 flex items-center justify-center flex-shrink-0">
      <div className="w-3 h-3 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
    </div>
  );
  if (state === "done" || state === "approved") return (
    <div className="w-5 h-5 rounded-full bg-green-950 flex items-center justify-center flex-shrink-0">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 5L4 7L8 3" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (state === "rolled") return (
    <div className="w-5 h-5 rounded-full bg-red-950 flex items-center justify-center flex-shrink-0">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M3 3l4 4M7 3l-4 4" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
  return (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-white/5" : "bg-black/8"}`}>
      <div className={`w-2 h-2 rounded-full border ${isDark ? "border-white/20" : "border-black/20"}`} />
    </div>
  );
}

function GlassLogo() {
  return (
    <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5"/>
        <path d="M4.5 7L6.5 9L9.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export default function Glass() {
  const [theme, setTheme]             = useState("dark");
  const [hoodOpen, setHoodOpen]       = useState(false);
  const [input, setInput]             = useState("");
  const [agentStatus, setAgentStatus] = useState("ready");
  const [agentBusy, setAgentBusy]     = useState(false);
  const [started, setStarted]         = useState(false);
  const [sessionName, setSessionName] = useState("");
  const threadRef   = useRef(null);
  const termRef     = useRef(null);
  const inputRef    = useRef(null);
  const unlistenRef = useRef([]);

  const [thread, setThread]       = useState([]);
  const [plan, setPlan]           = useState([]);
  const [stats, setStats]         = useState({ steps:0, total:0, actions:0, files:0, redirects:0 });
  const [termLines, setTermLines] = useState([{ cls:"dim", text:"glass v0.1 — waiting for task" }]);

  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [thread]);
  useEffect(() => { if (termRef.current)   termRef.current.scrollTop   = termRef.current.scrollHeight;   }, [termLines]);
  useEffect(() => { return () => { unlistenRef.current.forEach(fn => fn()); }; }, []);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, [started]);

  const addTermLine = (cls, text) => setTermLines(p => [...p, { cls, text }]);
  const addNote     = (text, color="") => setThread(p => [...p, { type:"note", text, color }]);

  const isTauri = typeof window !== "undefined" && !!window.__TAURI__;

  // ── detect file extension from content or filename ───────────────────────
  function smartFilename(raw, fallback) {
    // if raw already has a known extension, use it
    const known = [".md", ".html", ".htm", ".py", ".js", ".ts", ".css", ".json", ".txt", ".sh", ".jsx", ".tsx"];
    for (const ext of known) {
      if (raw && raw.toLowerCase().endsWith(ext)) return raw.trim();
    }
    // detect from content
    if (fallback) {
      const f = fallback.toLowerCase();
      if (f.includes(".")) return fallback.trim();
    }
    // guess from content shape
    return fallback || "glass-output.txt";
  }

  // ── extract the real filename from a diff line like "+ anthropic_article.md: ..." ──
  function extractFilename(diff) {
    if (!diff) return null;
    for (const line of diff) {
      if (!line.startsWith("+")) continue;
      const content = line.slice(2).trim();
      // match "filename.ext:" or "filename.ext (..." or just "filename.ext"
      const match = content.match(/^([\w\-. ]+\.(md|html|htm|py|js|ts|css|json|txt|sh|jsx|tsx))/i);
      if (match) return match[1].trim();
    }
    return null;
  }

  // ── clean diff lines into pure content ───────────────────────────────────
  function cleanDiff(diff) {
    if (!diff) return "";
    return diff
      .filter(l => l.startsWith("+") && l.length > 1)
      .map(l => {
        let content = l.slice(2); // strip "+ "
        // if line is "filename.ext: rest of content" — strip the filename prefix
        content = content.replace(/^[\w\-. ]+\.(md|html|htm|py|js|ts|css|json|txt|sh|jsx|tsx):\s*/i, "");
        return content;
      })
      .join("\n")
      .trim();
  }

  // ── download a single card's output ──────────────────────────────────────
  function handleDownload(content, filename) {
    const clean = typeof content === "string" ? content : cleanDiff(content);
    const name  = smartFilename(filename, filename);
    const mime  = name.endsWith(".html") || name.endsWith(".htm") ? "text/html" : "text/plain";
    const blob  = new Blob([clean], { type: mime });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href      = url;
    a.download  = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── download all — find the last/best file and save it cleanly ───────────
  function downloadAll() {
    const cards = thread.filter(i => i.type === "card" && i.diff && i.state !== "rolled");
    if (!cards.length) return;

    // find the card with the most content — usually the final "create file" card
    const best = cards.reduce((a, b) => {
      const aLen = cleanDiff(a.diff).length;
      const bLen = cleanDiff(b.diff).length;
      return bLen > aLen ? b : a;
    });

    const content  = cleanDiff(best.diff);
    const filename = extractFilename(best.diff) || smartFilename(sessionName, "glass-output.md");
    handleDownload(content, filename);
  }

  function handleStepCardEvent(data) {
    if (data.type === "step") {
      const cardId = `live-${Date.now()}-${Math.random()}`;
      setThread(p => [...p, {
        type:"card", id:cardId,
        label:data.label, sub:data.sub,
        state:data.state, diff:data.diff || null,
      }]);
      addTermLine(data.state === "done" ? "out" : "warn", `→ ${data.label}`);
      setStats(p => ({...p, actions:p.actions+1}));
    }
    if (data.type === "explain") addNote(data.text);
    if (data.type === "done") {
      setAgentBusy(false);
      setAgentStatus("done");
      addTermLine("cmd", `$ done — ${data.summary}`);
    }
  }

  function approveStep() {
    setThread(prev => {
      const cards = prev.filter(i => i.type === "card");
      const activeIdx = cards.findLastIndex(c => c.state === "active");
      if (activeIdx === -1) return prev;
      const activeCard  = cards[activeIdx];
      const nextWaiting = cards.slice(activeIdx + 1).find(c => c.state === "waiting");
      return prev.map(i => {
        if (i.type !== "card") return i;
        if (i.id === activeCard.id)               return { ...i, state:"approved" };
        if (nextWaiting && i.id === nextWaiting.id) return { ...i, state:"active" };
        return i;
      });
    });
    addNote("approved — continuing");
    addTermLine("cmd", "$ [user approved]");
    setStats(p => ({...p, steps:p.steps+1}));
  }

  function approveAll() {
    setThread(p => p.map(i => i.type==="card"
      ? {...i, state:(i.state==="waiting"||i.state==="active") ? "approved" : i.state} : i));
    setPlan(p => p.map(x => ({...x, state:"done"})));
    setAgentBusy(false);
    setAgentStatus("all approved");
    addNote("all steps approved");
    addTermLine("cmd", "$ [approve-all]");
  }

  function rollBack() {
    setThread(prev => {
      const lastActive = [...prev].reverse().find(i => i.type==="card" && (i.state==="active"||i.state==="approved"));
      if (!lastActive) return prev;
      const already = prev.some(i => i.type==="note" && i.text==="rolling back last step...");
      const next = prev.map(i => i.type==="card" && i.id===lastActive.id ? {...i, state:"rolled"} : i);
      return already ? next : [...next, {type:"note", text:"rolling back last step...", color:"err"}];
    });
    addTermLine("err", "$ git reset --soft HEAD~1");
    setAgentStatus("rolled back");
    setStats(p => ({...p, redirects:p.redirects+1}));
  }

  // ── reset to empty state ──────────────────────────────────────────────────
  function resetSession() {
    setStarted(false);
    setThread([]);
    setPlan([]);
    setInput("");                          // ← clears any leftover input
    setStats({ steps:0, total:0, actions:0, files:0, redirects:0 });
    setAgentBusy(false);
    setAgentStatus("ready");
    setHoodOpen(false);
    setTermLines([{ cls:"dim", text:"glass v0.1 — waiting for task" }]);
  }

  async function handleSend(override) {
    const val = (override !== undefined ? override : input).trim();
    if (!val) return;
    setInput("");

    if (!started) {
      setStarted(true);
      setSessionName(val.length > 32 ? val.slice(0, 32) + "…" : val);
      setTermLines([
        { cls:"dim", text:"glass v0.1 — session started" },
        { cls:"dim", text:"─────────────────────────" },
        { cls:"cmd", text:`$ glass --task "${val}"` },
      ]);
    }

    setAgentBusy(true);
    setAgentStatus("agent working...");
    setThread(p => [...p, { type:"user", text:val }]);
    if (started) addTermLine("cmd", `$ glass --task "${val}"`);
    setStats(p => ({...p, redirects: started ? p.redirects+1 : p.redirects}));

    if (isTauri) {
      try {
        unlistenRef.current.forEach(fn => fn());
        unlistenRef.current = [];
        const { listen }  = await import("@tauri-apps/api/event");
        const { invoke }  = await import("@tauri-apps/api/core");
        const u1 = await listen("step-card",       e => handleStepCardEvent(e.payload));
        const u2 = await listen("terminal-line",   e => { const {cls,text}=e.payload; if(text?.trim()) addTermLine(cls,text.trim()); });
        const u3 = await listen("agent-cancelled", () => { setAgentBusy(false); setAgentStatus("cancelled"); addNote("agent cancelled","err"); });
        unlistenRef.current = [u1, u2, u3];
        await invoke("run_agent", { task:val, history:[] });
      } catch(err) {
        setThread(p => [...p, { type:"card", id:`err-${Date.now()}`, label:"error starting agent", sub:String(err), state:"rolled" }]);
        setAgentBusy(false); setAgentStatus("error");
      }
    } else {
      try {
        const res     = await fetch("/api/agent", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({task:val}) });
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream:true });
          const lines = buffer.split("\n");
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.trim()) continue;
            try { handleStepCardEvent(JSON.parse(line)); } catch {}
          }
        }
        setAgentBusy(false);
        if (agentStatus === "agent working...") setAgentStatus("done");
      } catch(err) {
        setThread(p => [...p, { type:"card", id:`err-${Date.now()}`, label:"connection error", sub:err.message, state:"rolled" }]);
        setAgentBusy(false); setAgentStatus("error");
      }
    }
  }

  async function handlePause() {
    if (!isTauri) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("cancel_agent");
      setAgentBusy(false); setAgentStatus("paused");
      addNote("agent paused");
    } catch {}
  }

  const isDark = theme === "dark";

  const T = {
    appBg:       isDark ? "bg-[#0e0e0f]"    : "bg-[#f5f4f0]",
    sidebarBg:   isDark ? "bg-[#0a0a0c]"    : "bg-[#eceae5]",
    cardBg:      isDark ? "bg-white/[0.03]" : "bg-white",
    inputBg:     isDark ? "bg-white/5"      : "bg-white",
    border:      isDark ? "border-white/8"  : "border-black/10",
    txt:         isDark ? "text-white/90"   : "text-black/85",
    txtMuted:    isDark ? "text-white/40"   : "text-black/45",
    txtFaint:    isDark ? "text-white/20"   : "text-black/25",
    planNext:    isDark ? "border-white/10 text-white/30"  : "border-black/12 text-black/35",
    noteDefault: isDark ? "text-white/30"   : "text-black/35",
    secBtn:      isDark
      ? "border-white/10 text-white/50 hover:border-white/25 hover:text-white/80"
      : "border-black/12 text-black/50 hover:border-black/25 hover:text-black/75",
    intervBtn:   isDark
      ? "border-white/10 text-white/40 hover:text-white/80 hover:border-white/25"
      : "border-black/12 text-black/45 hover:text-black/75 hover:border-black/25",
    hoodActive:  "border-orange-600/60 text-orange-400 bg-orange-950/30",
    hoodInact:   isDark ? "border-white/10 text-white/40" : "border-black/12 text-black/45",
    sessionCard: isDark ? "bg-white/[0.03] border-orange-600/40" : "bg-white border-orange-400/60",
    newSession:  isDark
      ? "border-white/10 text-white/35 hover:border-white/20 hover:text-white/60"
      : "border-black/12 text-black/40 hover:border-black/20 hover:text-black/60",
    statCard:    isDark ? "bg-white/[0.02] border-white/8" : "bg-white border-black/10",
    exampleBtn:  isDark
      ? "border-white/8 text-white/40 hover:border-orange-600/40 hover:text-white/70 hover:bg-orange-950/20"
      : "border-black/10 text-black/45 hover:border-orange-400/40 hover:text-black/70 hover:bg-orange-50",
  };

  // ── EMPTY STATE ───────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className={`h-screen flex flex-col ${T.appBg} font-sans overflow-hidden transition-colors duration-300`}>
        <div className={`flex items-center justify-between px-5 h-12 border-b ${T.border} flex-shrink-0`}>
          <div className="flex items-center gap-2.5">
            <GlassLogo />
            <span className={`text-[15px] font-semibold tracking-tight ${T.txt}`}>Glass</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${T.border} ${T.txtMuted}`}>v0.1</span>
          </div>
          <button onClick={() => setTheme(isDark ? "light" : "dark")} className={`text-xs px-3 py-1 rounded-lg border transition-all ${T.secBtn}`}>
            {isDark ? "light mode" : "dark mode"}
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center mb-1">
              <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5"/>
                <path d="M4.5 7L6.5 9L9.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className={`text-xl font-semibold tracking-tight ${T.txt}`}>Describe a task.</h1>
            <p className={`text-sm leading-relaxed ${T.txtMuted}`}>
              Glass shows you every step before anything happens — approve, redirect, or roll back at any point.
            </p>
          </div>

          <div className="w-full max-w-lg flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="What do you want to build or do?"
              className={`flex-1 text-sm px-4 py-3 rounded-xl border ${T.border} ${T.inputBg} ${T.txt} outline-none focus:border-orange-500/50 transition-all`}
            />
            <button onClick={() => handleSend()} className="px-5 py-3 text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all">
              go
            </button>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-lg">
            <p className={`text-[10px] uppercase tracking-wider text-center ${T.txtFaint}`}>try an example</p>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => handleSend(ex)} className={`text-left text-xs px-4 py-2.5 rounded-xl border transition-all ${T.exampleBtn}`}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE COCKPIT ────────────────────────────────────────────────────────
  const doneCards = thread.filter(i => i.type === "card" && i.diff && i.state !== "rolled");

  return (
    <div className={`h-screen flex flex-col ${T.appBg} font-sans overflow-hidden transition-colors duration-300`}>
      <div className={`flex items-center justify-between px-5 h-12 border-b ${T.border} flex-shrink-0`}>
        <div className="flex items-center gap-2.5">
          <GlassLogo />
          <span className={`text-[15px] font-semibold tracking-tight ${T.txt}`}>Glass</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${T.border} ${T.txtMuted}`}>v0.1</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${agentBusy ? "bg-orange-500 animate-pulse" : "bg-green-500"}`} />
            <span className={`text-xs ${T.txtMuted}`}>{agentStatus}</span>
          </div>
          {!agentBusy && doneCards.length > 0 && (
            <button onClick={downloadAll} className="text-xs px-3 py-1 rounded-lg border transition-all border-green-800/40 text-green-400 hover:bg-green-950/30">
              ↓ download all
            </button>
          )}
          {agentBusy && isTauri && (
            <button onClick={handlePause} className="text-xs px-3 py-1 rounded-lg border transition-all border-red-800/40 text-red-400 hover:bg-red-950/30">
              pause
            </button>
          )}
          <button onClick={() => setTheme(isDark ? "light" : "dark")} className={`text-xs px-3 py-1 rounded-lg border transition-all ${T.secBtn}`}>
            {isDark ? "light mode" : "dark mode"}
          </button>
          <button onClick={() => setHoodOpen(o => !o)} className={`text-xs px-3 py-1 rounded-lg border transition-all ${hoodOpen ? T.hoodActive : T.hoodInact}`}>
            {hoodOpen ? "close the hood" : "open the hood"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* sidebar */}
        <div className={`w-52 ${T.sidebarBg} border-r ${T.border} flex flex-col flex-shrink-0`}>
          <div className={`p-3 border-b ${T.border}`}>
            <p className={`text-[10px] uppercase tracking-wider ${T.txtFaint} mb-2`}>session</p>
            <div className={`flex items-center gap-2 p-2 rounded-lg border ${T.sessionCard}`}>
              <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className={`text-xs font-medium ${T.txt} truncate`}>{sessionName}</p>
                <p className={`text-[10px] ${T.txtMuted}`}>active now</p>
              </div>
            </div>
            <button onClick={resetSession} className={`flex items-center gap-1.5 w-full mt-1.5 p-2 rounded-lg border border-dashed text-xs transition-all ${T.newSession}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              new session
            </button>
          </div>

          <div className={`p-3 border-b ${T.border}`}>
            <p className={`text-[10px] uppercase tracking-wider ${T.txtFaint} mb-2`}>agent</p>
            <div className={`flex items-center gap-2 p-2 rounded-lg border ${T.border} ${T.cardBg}`}>
              <div className={`w-6 h-6 rounded-md ${isDark?"bg-white/5":"bg-black/6"} flex items-center justify-center flex-shrink-0`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="3" width="10" height="7" rx="2" stroke="#f97316" strokeWidth="1"/>
                  <path d="M4 3V2a2 2 0 014 0v1" stroke="#f97316" strokeWidth="1"/>
                </svg>
              </div>
              <div>
                <p className={`text-xs font-medium ${T.txt}`}>Claude</p>
                <p className={`text-[10px] ${T.txtMuted}`}>claude-sonnet-4</p>
              </div>
            </div>
          </div>

          <div className="p-3 grid grid-cols-2 gap-1.5">
            {[
              { label:"steps",     val:`${stats.steps}/${stats.total || "—"}` },
              { label:"actions",   val:stats.actions   },
              { label:"files",     val:stats.files     },
              { label:"redirects", val:stats.redirects },
            ].map(s => (
              <div key={s.label} className={`rounded-lg p-2 border ${T.statCard}`}>
                <p className={`text-[10px] ${T.txtMuted} mb-0.5`}>{s.label}</p>
                <p className={`text-lg font-semibold ${T.txt}`}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* main */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {plan.length > 0 && (
            <div className={`px-4 py-2.5 border-b ${T.border} flex-shrink-0`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] uppercase tracking-wider ${T.txtFaint}`}>proposed plan</span>
                <button onClick={approveAll} className="text-[11px] text-green-400 bg-green-950/50 border border-green-800/40 rounded-md px-2.5 py-0.5 hover:bg-green-950 transition-all">
                  approve all
                </button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {plan.map(p => (
                  <span key={p.id} className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                    p.state==="done"   ? "bg-green-950/50 border-green-800/40 text-green-400" :
                    p.state==="active" ? "bg-orange-950/50 border-orange-700/40 text-orange-400" :
                    T.planNext
                  }`}>{p.label}</span>
                ))}
              </div>
            </div>
          )}

          <div ref={threadRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {thread.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className={`text-xs ${T.txtFaint}`}>Glass is starting…</p>
              </div>
            )}
            {thread.map((item, i) => {
              if (item.type === "user") return (
                <div key={i} className="self-end max-w-[72%]">
                  <div className={`text-sm px-3.5 py-2.5 rounded-2xl rounded-br-sm border ${T.border} ${T.cardBg} ${T.txt} leading-relaxed`}>
                    {item.text}
                  </div>
                </div>
              );
              if (item.type === "note") return (
                <p key={i} className={`text-[11px] text-center py-0.5 ${item.color==="err" ? "text-red-400" : T.noteDefault}`}>
                  {item.text}
                </p>
              );
              return <StepCard key={item.id || i} card={item} isDark={isDark} onDownload={handleDownload} />;
            })}
          </div>

          <div className={`px-4 pt-2 pb-1.5 flex gap-1.5 flex-wrap border-t ${T.border} flex-shrink-0`}>
            {["try a different approach","ask me a question first","why is this happening?","use a different file"].map(t => (
              <button key={t} onClick={() => setInput(t)} className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${T.intervBtn}`}>{t}</button>
            ))}
          </div>

          <div className="px-4 pb-2 flex gap-2 flex-shrink-0">
            <button onClick={approveStep} className="flex-1 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all">
              approve step
            </button>
            <button onClick={rollBack} className={`px-4 py-2 text-sm border rounded-xl transition-all ${T.secBtn}`}>
              roll back
            </button>
            <button onClick={approveAll} className={`px-4 py-2 text-sm border rounded-xl transition-all ${T.secBtn}`}>
              approve all
            </button>
          </div>

          <div className="px-4 pb-4 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="redirect, ask a question, or change something..."
              className={`flex-1 text-sm px-4 py-2.5 rounded-xl border ${T.border} ${T.inputBg} ${T.txt} outline-none focus:border-orange-500/50 transition-all`}
            />
            <button onClick={() => handleSend()} className="px-5 py-2.5 text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all">
              send
            </button>
          </div>
        </div>

        {/* terminal hood */}
        <div className={`bg-[#060608] flex flex-col border-l ${T.border} transition-all duration-300 overflow-hidden flex-shrink-0 ${hoodOpen ? "w-56" : "w-0"}`}>
          <div className="px-3.5 py-2.5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-mono text-white/30 tracking-wider">under the hood</span>
            <div className={`w-1.5 h-1.5 rounded-full ${agentBusy ? "bg-orange-500 animate-pulse" : "bg-white/20"}`} />
          </div>
          <div ref={termRef} className="flex-1 overflow-y-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed">
            {termLines.map((l, i) => (
              <div key={i} className={
                l.cls==="cmd"  ? "text-green-400"  :
                l.cls==="warn" ? "text-orange-400" :
                l.cls==="err"  ? "text-red-400"    :
                l.cls==="out"  ? "text-white/50"   : "text-white/20"
              }>{l.text}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}