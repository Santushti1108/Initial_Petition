import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getHistoryItem } from "@/lib/history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "../components/PageHeader";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";

function scoreColor(score) {
  if (score >= 70) return "text-green-400";
  if (score >= 45) return "text-yellow-400";
  return "text-red-400";
}

export default function Dashboard() {
  const [showMore, setShowMore] = useState(false);
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

  const { summary, sentiment, sections, viability, legal_provisions, stats } = analysis;
  const favorPct = Math.round(sentiment?.positive_pct || 0);

  return (
    <div className="min-h-screen p-12 space-y-10 text-white max-w-5xl mx-auto">
      <PageHeader title="Analysis Dashboard" backLink="/upload" backToPageLabel="Back to Upload" />

      {fileName && (
        <p className="text-gray-500 text-sm -mt-8">{fileName}</p>
      )}

      {/* Viability score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center md:col-span-1">
          <CardContent className="py-10 flex flex-col items-center gap-2">
            <p className={`text-5xl font-bold ${scoreColor(viability.score)}`}>
              {viability.score}
            </p>
            <p className="text-gray-400 text-sm">Court viability / 100</p>
            <span className="mt-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
              {viability.verdict}
            </span>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-[var(--primary)]">Assessment</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 text-sm leading-relaxed">
            {viability.verdict_detail}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--primary)]">Petition Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 text-sm leading-relaxed">
          {summary}
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="text-center">
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <Info className="w-8 h-8 text-gray-400" />
            <p className="text-5xl font-bold text-[var(--primary)]">{favorPct}%</p>
            <p className="text-gray-400">positive tone</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <CardTitle className="text-[var(--primary)]">Strengths</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-400 text-sm space-y-2">
            {viability.strengths?.length ? (
              viability.strengths.slice(0, showMore ? undefined : 4).map((s, i) => (
                <p key={i}>• {s}</p>
              ))
            ) : (
              <p>No strengths identified</p>
            )}
          </CardContent>
        </Card>
      </div>

      <button
        onClick={() => setShowMore(!showMore)}
        className="bg-[var(--primary)] text-black px-6 py-2 rounded-full font-semibold hover:opacity-90 transition"
      >
        {showMore ? "Show less" : "Show more"}
      </button>

      {showMore && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <CardTitle className="text-[var(--primary)]">Issues to fix</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-400 text-sm space-y-2">
              {viability.issues?.map((issue, i) => (
                <p key={i}>• {issue}</p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">Petition structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[...(sections.found || []).map((s) => ({ name: s, ok: true })),
                  ...(sections.missing || []).map((s) => ({ name: s, ok: false }))]
                  .map(({ name, ok }) => (
                    <div key={name} className="flex items-center gap-2 text-sm text-gray-400">
                      {ok ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <span className="capitalize">{name.replace(/_/g, " ")}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {legal_provisions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-[var(--primary)]">Legal provisions cited</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {legal_provisions.map((p, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                  >
                    {p}
                  </span>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">Document stats</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-400 text-sm flex flex-wrap gap-4">
              <span>{stats.word_count?.toLocaleString()} words</span>
              <span>{stats.sections_found}/{stats.sections_total} sections</span>
              <span>{stats.provisions_cited} provisions</span>
              <span>{stats.cases_cited} citations</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
