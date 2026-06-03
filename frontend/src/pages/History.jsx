import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { FileText, Trash2, Clock } from "lucide-react";
import {
  clearHistory,
  getHistory,
  removeFromHistory,
} from "@/lib/history";

function scoreColor(score) {
  if (score >= 70) return "text-green-400";
  if (score >= 45) return "text-yellow-400";
  return "text-red-400";
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  const refresh = () => setItems(getHistory());

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    removeFromHistory(id);
    refresh();
  };

  const handleClearAll = () => {
    if (!items.length) return;
    if (window.confirm("Clear all analysis history?")) {
      clearHistory();
      refresh();
    }
  };

  return (
    <div className="min-h-screen text-white px-10 py-8 max-w-4xl mx-auto">
      <PageHeader title="Analysis History" backLink="/" />

      <div className="flex items-center justify-between mb-8 -mt-4">
        <p className="text-gray-400 text-sm">
          {items.length
            ? `${items.length} saved ${items.length === 1 ? "analysis" : "analyses"}`
            : "Past analyses appear here after you upload a petition"}
        </p>
        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            Clear all
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <FileText className="w-10 h-10 text-yellow-500/50" />
            <p className="text-gray-400">No analyses yet</p>
            <Button
              onClick={() => navigate("/upload")}
              className="bg-[var(--primary)] text-black rounded-full px-6 hover:opacity-90"
            >
              Upload a petition
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const score = item.analysis?.viability?.score ?? 0;
            const verdict = item.analysis?.viability?.verdict ?? "—";

            return (
              <Card
                key={item.id}
                className="rounded-xl border-[#1f1f1f] hover:border-yellow-500/40 transition-all cursor-pointer"
                onClick={() => navigate(`/dashboard?id=${item.id}`)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-yellow-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-200 truncate">
                      {item.fileName}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.analyzedAt)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-2xl font-bold ${scoreColor(score)}`}>
                      {score}
                    </p>
                    <p className="text-xs text-yellow-500/80 max-w-[120px] truncate">
                      {verdict}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
