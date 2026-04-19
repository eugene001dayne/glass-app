"use client";

import { useState, useRef, useEffect } from "react";

function StepCard({ card, isDark }) {
  const cardBg = {
    done:     isDark ? "bg-green-950/20  border-green-800/40"  : "bg-green-50    border-green-200",
    active:   isDark ? "bg-orange-950/20 border-orange-600/50" : "bg-orange-50   border-orange-300",
    waiting:  isDark ? "bg-white/[0.02]  border-white/8"       : "bg-white       border-black/10",
    rolled:   isDark ? "bg-red-950/20    border-red-800/40"    : "bg-red-50      border-red-200",
    approved: isDark ? "bg-green-950/20  border-green-700/50"  : "bg-green-50    border-green-200",
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

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 transition-all duration-200 ${cardBg}`}>
      <div className="flex items-center gap-2">
        <StateIcon state={card.state} isDark={isDark} />
        <span className={`text-sm font-medium ${labelColor}`}>{card.label}</span>
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

export default function Glass() {
  const [theme, setTheme]             = useState("dark");
  const [hoodOpen, setHoodOpen]       = useState(false);
  const [input, setInput]             = useState("");
  const [agentStatus, setAgentStatus] = useState("agent working");
  const [agentBusy, setAgentBusy]     = useState(true);
  const threadRef   = useRef(null);
  const termRef     = useRef(null);
  const unlistenRef = useRef([]); // holds Tauri event unsubscribe functions

  const [thread, setThread] = useState([
    { type:"user", text:"make me a landing page for my bakery called Golden Crumb" },
    { type:"card", id:"c1", label:"understood your request",  sub:"bakery landing page — Golden Crumb — warm tone, contact form", state:"done" },
    { type:"card", id:"c2", label:"created file structure",   sub:"index.html — style.css — images/ — contact.js", state:"done",
      diff:["+ golden-crumb/index.html","+ golden-crumb/style.css","+ golden-crumb/contact.js"] },
    { type:"card", id:"c3", label:"writing the homepage",     sub:"hero, menu highlights, about section, contact form", state:"active",
      diff:['  <body>','+   <section class="hero">','+     <h1>Golden Crumb</h1>','+     <p>Fresh from the oven, every morning</p>','-     <!-- hero placeholder -->','  </section>'],
      explain:"Claude is writing the top section of your page — your bakery name and tagline. Nothing is saved permanently until you approve." },
    { type:"card", id:"c4", label:"add styling & colours",    sub:"warm amber palette — mobile responsive", state:"waiting" },
    { type:"card", id:"c5", label:"preview ready for review", sub:"approve, redirect, or download",         state:"waiting" },
  ]);

  const [plan, setPlan] = useState([
    { id:"p1", label:"understand task", state:"done"   },
    { id:"p2", label:"create files",    state:"done"   },
    { id:"p3", label:"write homepage",  state:"active" },
    { id:"p4", label:"add styling",     state:"next"   },
    { id:"p5", label:"preview",         state:"next"   },
  ]);

  const [stats, setStats] = useState({ steps:2, total:5, actions:7, files:3, redirects:0 });

  const [termLines, setTermLines] = useState([
    { cls:"dim",  text:"glass v0.1 — session started"        },
    { cls:"dim",  text:"─────────────────────────"           },
    { cls:"cmd",  text:'$ claude --task "landing page"'       },
    { cls:"out",  text:"agent session initialised"            },
    { cls:"out",  text:"reading task context..."              },
    { cls:"cmd",  text:"$ mkdir golden-crumb"                 },
    { cls:"out",  text:"created: index.html"                  },
    { cls:"out",  text:"created: style.css"                   },
    { cls:"out",  text:"created: contact.js"                  },
    { cls:"cmd",  text:"$ write index.html"                   },
    { cls:"warn", text:"→ writing hero section..."            },
    { cls:"out",  text:'> h1: "Golden Crumb"'                },
    { cls:"out",  text:'> tagline: "Fresh from the oven..."'  },
    { cls:"dim",  text:"─────────────────────────"           },
    { cls:"dim",  text:"pending: menu section"                },
    { cls:"dim",  text:"pending: contact form"                },
    { cls:"dim",  text:"pending: style.css"                   },
  ]);

  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [thread]);
  useEffect(() => { if (termRef.current)   termRef.current.scrollTop   = termRef.current.scrollHeight;   }, [termLines]);

  // cleanup Tauri listeners on unmount
  useEffect(() => {
    return () => { unlistenRef.current.forEach(fn => fn()); };
  }, []);

  const addTermLine = (cls, text) => setTermLines(p => [...p, { cls, text }]);
  const addNote     = (text, color="") => setThread(p => [...p, { type:"note", text, color }]);
  const updateCard  = (id, changes) => setThread(p => p.map(i => i.type==="card" && i.id===id ? {...i,...changes} : i));

  function approveStep() {
    updateCard("c3", { state:"approved" });
    updateCard("c4", { state:"active" });
    setPlan(p => p.map(x => x.id==="p3" ? {...x,state:"done"} : x.id==="p4" ? {...x,state:"active"} : x));
    setStats(p => ({...p, steps:3, actions:p.actions+2}));
    addNote("you approved — styling next");
    addTermLine("cmd","$ [user approved] → writing style.css");
    setAgentStatus("styling in progress");
  }

  function approveAll() {
    setThread(p => p.map(i => i.type==="card" ? {...i, state:(i.state==="waiting"||i.state==="active")?"approved":i.state} : i));
    setPlan(p => p.map(x => ({...x, state:"done"})));
    setStats(p => ({...p, steps:5}));
    setAgentBusy(false);
    setAgentStatus("all steps approved");
    addNote("Glass is finishing up — all approved");
    addTermLine("cmd","$ [approve-all] running remaining steps...");
  }

  function rollBack() {
    setThread(prev => {
      if (prev.some(i => i.type==="note" && i.text==="rolling back last step...")) return prev;
      return [...prev, { type:"note", text:"rolling back last step...", color:"err" }];
    });
    updateCard("c3", { state:"rolled" });
    addTermLine("err","$ git reset --soft HEAD~1");
    setAgentStatus("rolled back");
    setAgentBusy(false);
  }

  // ── detect Tauri environment ──────────────────────────────────────────────
  const isTauri = typeof window !== "undefined" && !!window.__TAURI__;

  // ── Tauri event handler for step cards ───────────────────────────────────
  function handleStepCardEvent(data) {
    if (data.type === "step") {
      const cardId = `live-${Date.now()}-${Math.random()}`;
      setThread(p => [...p, {
        type: "card",
        id: cardId,
        label: data.label,
        sub: data.sub,
        state: data.state,
        diff: data.diff || null,
      }]);
      addTermLine(data.state === "done" ? "out" : "warn", `→ ${data.label}`);
      setStats(p => ({...p, actions: p.actions + 1}));
    }
    if (data.type === "explain") {
      addNote(data.text);
    }
    if (data.type === "done") {
      setAgentBusy(false);
      setAgentStatus("done");
      addTermLine("cmd", `$ done — ${data.summary}`);
    }
  }

  // ── send handler: Tauri path or web fetch path ────────────────────────────
  async function handleSend() {
    const val = input.trim();
    if (!val) return;
    setInput("");
    setAgentBusy(true);
    setAgentStatus("agent working...");
    setThread(p => [...p, { type:"user", text:val }]);
    addTermLine("cmd", `$ glass --task "${val}"`);

    if (isTauri) {
      // ── desktop path ──
      try {
        // clean up any old listeners
        unlistenRef.current.forEach(fn => fn());
        unlistenRef.current = [];

        const { listen } = await import("@tauri-apps/api/event");
        const { invoke } = await import("@tauri-apps/api/core");

        // listen to step cards from Rust
        const unlistenCards = await listen("step-card", (event) => {
          handleStepCardEvent(event.payload);
        });

        // listen to terminal lines from Rust
        const unlistenTerm = await listen("terminal-line", (event) => {
          const { cls, text } = event.payload;
          if (text && text.trim()) addTermLine(cls, text.trim());
        });

        // listen for cancel
        const unlistenCancel = await listen("agent-cancelled", () => {
          setAgentBusy(false);
          setAgentStatus("cancelled");
          addNote("agent cancelled", "err");
        });

        unlistenRef.current = [unlistenCards, unlistenTerm, unlistenCancel];

        // invoke the Rust command
        await invoke("run_agent", { task: val, history: [] });

      } catch (err) {
        setThread(p => [...p, {
          type:"card", id:`err-${Date.now()}`,
          label:"error starting agent",
          sub: String(err),
          state:"rolled"
        }]);
        setAgentBusy(false);
        setAgentStatus("error");
      }

    } else {
      // ── web path (unchanged) ──
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: val }),
        });

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              handleStepCardEvent(data);
            } catch { /* incomplete JSON */ }
          }
        }
      } catch (err) {
        setThread(p => [...p, {
          type:"card", id:`err-${Date.now()}`,
          label:"connection error",
          sub: err.message,
          state:"rolled"
        }]);
        setAgentBusy(false);
        setAgentStatus("error");
      }
    }
  }

  // ── pause / cancel ────────────────────────────────────────────────────────
  async function handlePause() {
    if (!isTauri) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("cancel_agent");
      setAgentBusy(false);
      setAgentStatus("paused");
      addNote("agent paused");
    } catch (err) {
      console.error("pause failed:", err);
    }
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
  };

  return (
    <div className={`h-screen flex flex-col ${T.appBg} font-sans overflow-hidden transition-colors duration-300`}>

      {/* topbar */}
      <div className={`flex items-center justify-between px-5 h-12 border-b ${T.border} flex-shrink-0`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5"/>
              <path d="M4.5 7L6.5 9L9.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={`text-[15px] font-semibold tracking-tight ${T.txt}`}>Glass</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${T.border} ${T.txtMuted}`}>v0.1</span>
          {isTauri && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border border-orange-800/40 text-orange-400`}>
              desktop
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${agentBusy ? "bg-orange-500 animate-pulse" : "bg-green-500"}`} />
            <span className={`text-xs ${T.txtMuted}`}>{agentStatus}</span>
          </div>
          {agentBusy && isTauri && (
            <button onClick={handlePause} className={`text-xs px-3 py-1 rounded-lg border transition-all border-red-800/40 text-red-400 hover:bg-red-950/30`}>
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

      {/* body */}
      <div className="flex flex-1 overflow-hidden">

        {/* sidebar */}
        <div className={`w-52 ${T.sidebarBg} border-r ${T.border} flex flex-col flex-shrink-0`}>
          <div className={`p-3 border-b ${T.border}`}>
            <p className={`text-[10px] uppercase tracking-wider ${T.txtFaint} mb-2`}>sessions</p>
            <div className={`flex items-center gap-2 p-2 rounded-lg border ${T.sessionCard}`}>
              <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
              <div>
                <p className={`text-xs font-medium ${T.txt}`}>Bakery landing page</p>
                <p className={`text-[10px] ${T.txtMuted}`}>active now</p>
              </div>
            </div>
            <button className={`flex items-center gap-1.5 w-full mt-1.5 p-2 rounded-lg border border-dashed text-xs transition-all ${T.newSession}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              new session
            </button>
          </div>

          <div className={`p-3 border-b ${T.border}`}>
            <p className={`text-[10px] uppercase tracking-wider ${T.txtFaint} mb-2`}>agent</p>
            <div className={`flex items-center gap-2 p-2 rounded-lg border ${T.border} ${T.cardBg}`}>
              <div className={`w-6 h-6 rounded-md ${isDark ? "bg-white/5" : "bg-black/6"} flex items-center justify-center flex-shrink-0`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="3" width="10" height="7" rx="2" stroke="#f97316" strokeWidth="1"/>
                  <path d="M4 3V2a2 2 0 014 0v1" stroke="#f97316" strokeWidth="1"/>
                </svg>
              </div>
              <div>
                <p className={`text-xs font-medium ${T.txt}`}>Claude Code</p>
                <p className={`text-[10px] ${T.txtMuted}`}>claude-sonnet-4</p>
              </div>
            </div>
          </div>

          <div className="p-3 grid grid-cols-2 gap-1.5">
            {[
              { label:"steps",     val:`${stats.steps}/${stats.total}` },
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

          {/* plan bar */}
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

          {/* thread */}
          <div ref={threadRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
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
              return <StepCard key={item.id || i} card={item} isDark={isDark} />;
            })}
          </div>

          {/* interventions */}
          <div className={`px-4 pt-2 pb-1.5 flex gap-1.5 flex-wrap border-t ${T.border} flex-shrink-0`}>
            {["try a different approach","ask me a question first","why is this happening?","use a different file"].map(t => (
              <button key={t}
                onClick={() => t === "why is this happening?"
                  ? updateCard("c3", { explain:"Claude is writing the top section of your page — your bakery name and tagline. Nothing saves until you approve." })
                  : setInput(t)
                }
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${T.intervBtn}`}
              >{t}</button>
            ))}
          </div>

          {/* controls */}
          <div className="px-4 pb-2 flex gap-2 flex-shrink-0">
            <button onClick={approveStep} className="flex-1 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all">
              approve step
            </button>
            <button onClick={rollBack} className={`px-4 py-2 text-sm border rounded-xl transition-all ${T.secBtn}`}>
              roll back
            </button>
            <button onClick={() => document.getElementById("glass-input").focus()} className={`px-4 py-2 text-sm border rounded-xl transition-all ${T.secBtn}`}>
              redirect
            </button>
          </div>

          {/* input */}
          <div className="px-4 pb-4 flex gap-2 flex-shrink-0">
            <input
              id="glass-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="redirect, ask a question, or change something..."
              className={`flex-1 text-sm px-4 py-2.5 rounded-xl border ${T.border} ${T.inputBg} ${T.txt} outline-none focus:border-orange-500/50 transition-all`}
            />
            <button onClick={handleSend} className="px-5 py-2.5 text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all">
              send
            </button>
          </div>
        </div>

        {/* terminal */}
        <div className={`bg-[#060608] flex flex-col border-l ${T.border} transition-all duration-300 overflow-hidden flex-shrink-0 ${hoodOpen ? "w-56" : "w-0"}`}>
          <div className="px-3.5 py-2.5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-mono text-white/30 tracking-wider">under the hood</span>
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
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