import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { analyzePetition } from "@/lib/api";
import { saveToHistory } from "@/lib/history";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported");
      setFile(null);
      return;
    }

    if (selected.size > 16 * 1024 * 1024) {
      setError("File must be under 16MB");
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await analyzePetition(file);
      const entry = saveToHistory({ fileName: file.name, analysis: result });
      navigate("/dashboard", {
        state: { analysis: result, fileName: file.name, historyId: entry.id },
      });
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white px-10 py-8">
      <PageHeader title="Upload Document" backLink="/" />

      <div className="flex flex-col items-center mt-10">
        <p className="text-gray-400 mb-6">Upload a petition PDF to analyze</p>

        <Card className="w-full max-w-2xl rounded-2xl">
          <CardContent className="p-2">
            <label className="cursor-pointer block">
              <input
                type="file"
                className="hidden"
                onChange={handleFile}
                accept=".pdf,application/pdf"
                disabled={loading}
              />

              <div className="border-2 border-dashed border-yellow-500/30 rounded-xl py-16 flex flex-col items-center justify-center hover:border-yellow-500 transition-all duration-300">
                <Upload className="w-7 h-7 text-yellow-500 mb-2" />
                <h3 className="text-xl font-semibold text-white">
                  {file ? file.name : "Choose a PDF"}
                </h3>
                <p className="text-gray-400 mt-2">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : "Click here to browse files"}
                </p>
              </div>
            </label>

            {file && !loading && (
              <p className="mt-4 text-green-400 text-center">
                ✓ File ready for analysis
              </p>
            )}

            {loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-yellow-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing petition...
              </div>
            )}

            {error && (
              <p className="mt-4 text-red-400 text-center text-sm">{error}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="bg-[var(--primary)] text-black px-6 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
      </div>
    </div>
  );
}
