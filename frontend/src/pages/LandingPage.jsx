import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LadyJusticeCanvas from "@/components/LadyJusticeCanvas";

/* Types/deletes the text after "Predict", keeping per-segment colors */
function AnimatedTail() {
  const segments = [
    { text: "your legal ", className: "text-gray-200" },
    {
      text: "petition outcome.",
      className:
        "bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text",
    },
  ];
  const fullText = segments.reduce((acc, s) => acc + s.text, "");

  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState("typing"); // "typing" | "deleting"

  useEffect(() => {
    let timeout;
    if (phase === "typing") {
      if (count < fullText.length) {
        timeout = setTimeout(() => setCount((c) => c + 1), 70); // write speed
      } else {
        timeout = setTimeout(() => setPhase("deleting"), 3000); // hold full text
      }
    } else {
      if (count > 0) {
        timeout = setTimeout(() => setCount((c) => c - 1), 40); // delete speed
      } else {
        timeout = setTimeout(() => setPhase("typing"), 600); // hold empty
      }
    }
    return () => clearTimeout(timeout);
  }, [count, phase, fullText.length]);

  // Slice each colored segment based on how many chars are currently visible
  let offset = 0;
  const parts = segments.map((seg) => {
    const shown = Math.max(0, Math.min(seg.text.length, count - offset));
    offset += seg.text.length;
    return shown > 0 ? (
      <span key={seg.text} className={seg.className}>
        {seg.text.slice(0, shown)}
      </span>
    ) : null;
  });

  return (
    <>
      {parts}
      <span className="animate-pulse text-gray-200">|</span>
    </>
  );
}

export default function Landing() {
  const [active, setActive] = useState("home");
  const aboutRef = useRef(null);
  const processRef = useRef(null);
  const navigate = useNavigate();

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToProcess = () => {
    processRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen  text-white">
      {/*NAVBAR */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="rounded-full px-10 py-3 flex gap-6 bg-[#0a0a0a]/80 backdrop-blur border border-[#1f1f1f]">
          {/* Home */}
          <button
            onClick={() => setActive("home")}
            className={`px-5 py-1 rounded-full transition ${
              active === "home"
                ? "bg-[var(--primary)] text-black font-semibold"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Home
          </button>

          {/* Analyze */}
          <button
            onClick={() => {setActive("analyze"),
                           navigate("/upload");
            }}
            className={`px-5 py-1 rounded-full transition ${
              active === "analyze"
                ? "bg-[var(--primary)] text-black font-semibold"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Analyze
          </button>

          {/* History */}
          <button
            onClick={() => {
              setActive("history");
              navigate("/history");
            }}
            className={`px-5 py-1 rounded-full transition ${
              active === "history"
                ? "bg-[var(--primary)] text-black font-semibold"
                : "text-gray-300 hover:text-white"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="grid grid-cols-2 items-center px-16 py-20 gap-10">
        {/* LEFT IMAGE */}
        <div className="h-[600px] w-full -mr-20 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[400px] h-[400px] rounded-full bg-yellow-500/20 blur-[120px]" />
          </div>
          <LadyJusticeCanvas />
        </div>

        {/* RIGHT TEXT */}
        <div>
          <div className="text-6xl md:text-7xl font-extrabold leading-tight min-h-[180px]">
            {/* "Predict" is static and always stays */}
            <span className="text-gray-200">Predict </span>
            <AnimatedTail />
          </div>

          <p className="text-gray-400 mb-8 max-w-lg leading-relaxed">
            Analyze legal documents instantly. Identify risks, understand clauses.
          </p>

          <Button
            onClick={() => navigate("/upload")}
            className="text-black rounded-full px-8 py-5 hover:opacity-90 flex items-center gap-2"
          >
            Get Started →
          </Button>
        </div>
      </div>

      {/* ABOUT SECTION */}
      <div ref={aboutRef} className="px-20 py-20">
        <h1 className="text-5xl font-bold text-gray-200 mb-14">
          What we do
        </h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* CARD */}
          <div className="relative rounded-2xl p-8 bg-gradient-to-br from-[#241a14] to-[#121212] border border-[#1f1f1f] hover:border-yellow-500/40 transition-all duration-300">
            {/* Top Row */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs px-3 py-1 rounded-full border border-yellow-500 text-yellow-500">
                AI
              </span>
            </div>

            <h3 className="text-xl text-gray-200 font-semibold mb-3">
              Smart Analysis
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Our system reads legal documents and extracts key clauses and obligations.
            </p>

            <div className="text-xs text-gray-500">
              Instant insights
            </div>
          </div>

          {/* CARD 2 */}
          <div className="relative rounded-2xl p-8 bg-gradient-to-br from-[#241a14] to-[#121212] border border-[#1f1f1f] hover:border-yellow-500/40 transition-all duration-300 ">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs px-3 py-1 rounded-full border border-yellow-500 text-yellow-500">
                Risk
              </span>
            </div>

            <h3 className="text-xl text-gray-200 font-semibold mb-3">
              Risk Detection
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Identify hidden risks, loopholes, and ambiguous clauses instantly.
            </p>

            <div className="text-xs text-gray-500">
              Safer decisions
            </div>
          </div>

          {/* CARD 3 */}
          <div className="relative rounded-2xl p-8 bg-gradient-to-br from-[#241a14] to-[#121212] border border-[#1f1f1f] hover:border-yellow-500/40 transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs px-3 py-1 rounded-full border border-yellow-500 text-yellow-500">
                Summary
              </span>
            </div>

            <h3 className="text-xl text-gray-200 font-semibold mb-3">
              Clean Summaries
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Get structured summaries so you understand everything quickly.
            </p>

            <div className="text-xs text-gray-500">
              Save time
            </div>
          </div>
        </div>
      </div>

      {/* PROCESS SECTION */}
      <div ref={processRef} className="px-20 py-20">
        {/* Heading */}
        <h2 className="text-5xl font-bold text-gray-200 mb-16 leading-tight">
          Three steps.<br />Real insights.
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-1 bg-gradient-to-br from-[#241a14] to-[#121212] border border-[#1f1f1f] rounded-2xl overflow-hidden">
          {/* STEP 1 */}
          <div className="relative p-10 border-r border-[#1f1f1f] bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#1f1f1f]  transition-all duration-300">
            <span className="absolute right-6 top-6 text-[120px] font-bold text-yellow-500/10">
              01
            </span>

            <div className="w-10 h-10 rounded-lg border border-yellow-500 flex items-center justify-center text-yellow-500 mb-6">
              {"</>"}
            </div>

            <p className="text-xs text-gray-500 mb-2 tracking-widest">STEP 01</p>

            <h3 className="text-xl text-gray-200 font-semibold mb-3">
              Upload Document
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
              Paste or upload your legal file for analysis. No ambiguity — just execute.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="relative p-10  bg-gradient-to-br from-[#0a0a0a] to-[#111]   transition-all duration-300">
            <span className="absolute right-6 top-6 text-[120px] font-bold text-yellow-500/10">
              02
            </span>

            <div className="w-10 h-10 rounded-lg border border-yellow-500 flex items-center justify-center text-yellow-500 mb-6">
              ▶
            </div>

            <p className="text-xs text-gray-500 mb-2 tracking-widest">STEP 02</p>

            <h3 className="text-xl text-gray-200 font-semibold mb-3">
              AI Processing
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
              Our system analyzes clauses and detects risks intelligently.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="relative p-10 bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#1f1f1f]  transition-all duration-300">
            <span className="absolute right-6 top-6 text-[120px] font-bold text-yellow-500/10">
              03
            </span>

            <div className="w-10 h-10 rounded-lg border border-yellow-500 flex items-center justify-center text-yellow-500 mb-6">
              🏆
            </div>

            <p className="text-xs text-gray-500 mb-2 tracking-widest">STEP 03</p>

            <h3 className="text-xl text-gray-200 font-semibold mb-3">
              Get Insights
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
              View summary, risks, and actionable recommendations instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}