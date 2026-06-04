import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getHistoryItem } from "@/lib/history";
import ToneRing from "@/components/ToneRing";
import {
  ArrowLeft,
  Scale,
  FileText,
  AudioLines,
  ShieldCheck,
  AlertTriangle,
  Landmark,
  CheckCircle2,
  XCircle,
  CircleAlert,
} from "lucide-react";

const SECTION_LABELS = {
  title: "Title",
  jurisdiction: "Jurisdiction",
  parties: "Parties",
  facts: "Facts of the Case",
  grounds: "Grounds",
  legal_provisions: "Legal Provisions",
  prayer: "Prayer/Relief",
  verification: "Affidavit",
  limitation: "Limitation",
  documents_list: "List of Documents",
  annexures: "Annexures",
};

const STRUCTURE_ORDER = [
  "title",
  "jurisdiction",
  "parties",
  "facts",
  "grounds",
  "legal_provisions",
  "prayer",
  "verification",
  "limitation",
  "documents_list",
  "annexures",
];

function buildStructureChecklist(sections, critical_elements) {
  const found = new Set(sections?.found || []);
  const present = critical_elements?.present || {};

  const checks = {
    title: found.has("parties") && found.has("jurisdiction"),
    jurisdiction: found.has("jurisdiction"),
    parties: found.has("parties"),
    facts: found.has("facts"),
    grounds: found.has("grounds"),
    legal_provisions: found.has("legal_provisions"),
    prayer: found.has("prayer"),
    verification: found.has("verification"),
    limitation: "limitation" in present,
    documents_list: false,
    annexures: false,
  };

  return STRUCTURE_ORDER.map((key) => ({
    label: SECTION_LABELS[key],
    ok: checks[key],
  }));
}

function getToneDescription(sentiment, pct) {
  if (sentiment?.overall === "negative" || (sentiment?.negative_pct ?? 0) > 40) {
    return "The petition uses strongly negative or accusatory language that may affect how the court receives the arguments.";
  }
  if (pct >= 25 || sentiment?.overall === "positive") {
    return "The petition conveys a neutral to positive tone with proper legal language and respectful presentation.";
  }
  return "The petition conveys a largely neutral legal tone with mixed argumentative language throughout.";
}

function Panel({ icon: Icon, title, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-[#1f1f1f] bg-gradient-to-br from-[#141414] to-[#0c0c0c] p-6 ${className}`}
    >
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-5 h-5 text-[#facc15]" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-[#facc15]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function TwoColumnList({ items, variant = "success" }) {
  const mid = Math.ceil(items.length / 2);
  const cols = [items.slice(0, mid), items.slice(mid)];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {cols.map((col, ci) => (
        <div key={ci} className="space-y-3">
          {col.map((text, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
              {variant === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <CircleAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [analysis, setAnalysis] = useState(null);
  const [fileName, setFileName] = useState("");
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (state?.analysis) {
      setAnalysis(state.analysis);
      setFileName(state.fileName || "");
      return;
    }

    const id = searchParams.get("id");
    if (id) {
      const item = getHistoryItem(id);
      if (item) {
        setAnalysis(item.analysis);
        setFileName(item.fileName);
        return;
      }
    }

    navigate("/upload", { replace: true });
  }, [state, searchParams, navigate]);

  if (!analysis) return null;

  const { summary, sentiment, sections, viability, critical_elements } = analysis;
  const score = viability?.score ?? 0;
  const favorPct = Math.round(sentiment?.positive_pct || 0);
  const structureItems = buildStructureChecklist(sections, critical_elements);
  const strengths = viability?.strengths || [];
  const issues = viability?.issues || [];

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6">
        <button
          onClick={() => navigate("/upload")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#facc15] transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Upload
        </button>

        {fileName && (
          <p className="text-xs text-gray-600 uppercase tracking-wider">{fileName}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel icon={Scale} title="Court Viability Score">
            <div className="flex flex-col items-center text-center py-2">
              <p className="text-7xl font-serif font-bold text-[#facc15] leading-none">
                {score}
              </p>
              <p className="text-gray-500 text-sm mt-1">/ 100</p>
              <div className="w-full max-w-xs h-2 rounded-full bg-[#1f1f1f] mt-6 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#facc15] to-[#f59e0b] transition-all duration-700"
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="mt-5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-[#facc15]/50 text-[#facc15] bg-[#facc15]/5">
                {viability?.verdict}
              </span>
            </div>
          </Panel>

          <Panel icon={Scale} title="Assessment" className="relative overflow-hidden">
            <div className="flex gap-4">
              <p className="text-gray-400 text-sm leading-relaxed flex-1">
                {viability?.verdict_detail}
              </p>
              <div className="hidden sm:flex shrink-0 w-28 h-28 items-center justify-center rounded-xl bg-gradient-to-br from-[#facc15]/20 to-transparent border border-[#facc15]/10">
                <div className="relative">
                  <Scale className="w-12 h-12 text-[#facc15]/80" />
                  <div className="absolute -bottom-2 -right-3 w-8 h-2 bg-amber-900/60 rounded-sm rotate-12" />
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <Panel icon={FileText} title="Petition Summary">
          <p className="text-gray-400 text-sm leading-relaxed">{summary}</p>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel icon={AudioLines} title="Original Tone">
            <div className="flex items-center gap-8">
              <ToneRing percent={favorPct} />
              <p className="text-gray-400 text-sm leading-relaxed">
                {getToneDescription(sentiment, favorPct)}
              </p>
            </div>
          </Panel>

          <Panel icon={ShieldCheck} title="Strengths">
            {strengths.length > 0 ? (
              <TwoColumnList items={strengths} variant="success" />
            ) : (
              <p className="text-gray-500 text-sm">No strengths identified</p>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel icon={AlertTriangle} title="Issues to Fix">
            {issues.length > 0 ? (
              <TwoColumnList items={issues} variant="issue" />
            ) : (
              <p className="text-gray-500 text-sm">No major issues identified</p>
            )}
          </Panel>

          <Panel icon={Landmark} title="Petition Structure">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
              {structureItems.map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-400">
                  {ok ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
