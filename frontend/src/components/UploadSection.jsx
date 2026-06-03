import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Loader2, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { apiUrl } from '../lib/api'

export default function UploadSection({ onResult, isAnalyzing, setIsAnalyzing }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles) => {
    setError(null)
    const f = acceptedFiles[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.pdf')) { setError('Only PDF files are supported'); return }
    if (f.size > 16 * 1024 * 1024) { setError('File size must be under 16MB'); return }
    setFile(f)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1, disabled: isAnalyzing,
  })

  const handleAnalyze = async () => {
    if (!file) return
    setIsAnalyzing(true); setError(null); setProgress(0)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const iv = setInterval(() => {
        setProgress((p) => { if (p >= 90) { clearInterval(iv); return 90 } return p + Math.random() * 12 })
      }, 400)

      const res = await axios.post(apiUrl('/analyze'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      clearInterval(iv)
      setProgress(100)
      setTimeout(() => { onResult(res.data); setIsAnalyzing(false); setProgress(0) }, 500)
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.')
      setIsAnalyzing(false); setProgress(0)
    }
  }

  return (
    <section id="analyze" className="relative py-24 bg-canvas overflow-hidden">
      {/* Ambient spectrum glow behind upload */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] spectrum-glow rounded-full opacity-15" />

      <div className="relative z-10 max-w-[560px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-heading-lg mb-3">
            Upload your <span className="text-slate italic">petition</span>
          </h2>
          <p className="text-[16px] text-graphite">
            Drop your petition PDF and let AI do the rest.
          </p>
        </div>

        <div className="frosted-card">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-[20px] p-14 text-center cursor-pointer transition-all duration-200 ${
                isDragActive ? 'border-ink bg-canvas' : 'border-pebble hover:border-ash'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-steel mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="text-[18px] font-normal text-ink mb-1">
                {isDragActive ? 'Drop your petition here' : 'Drag & drop your petition PDF'}
              </h3>
              <p className="text-[14px] text-slate mb-3">or click to browse files</p>
              <p className="text-[10px] text-steel uppercase tracking-[0.08em]">PDF files up to 16MB</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File card */}
              <div className="flex items-center gap-4 p-4 rounded-[16px] bg-canvas">
                <div className="w-10 h-10 rounded-[10px] bg-fog flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-ink" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-ink truncate">{file.name}</div>
                  <div className="text-[13px] text-slate">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
                {!isAnalyzing && (
                  <button onClick={() => { setFile(null); setError(null); onResult(null) }}
                    className="p-2 rounded-[10px] hover:bg-fog text-steel hover:text-ink transition-all duration-200">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress */}
              {isAnalyzing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-graphite">Analyzing petition...</span>
                    <span className="font-medium text-ink">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-[6px] rounded-full bg-fog overflow-hidden">
                    <div className="h-full rounded-full spectrum-gradient animate-chroma transition-all duration-300"
                      style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-slate">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {progress < 30 ? 'Extracting text from PDF...' :
                     progress < 60 ? 'Running NLP analysis...' :
                     progress < 80 ? 'Evaluating court viability...' :
                     'Generating report...'}
                  </div>
                </div>
              )}

              {/* Analyze button */}
              {!isAnalyzing && (
                <button onClick={handleAnalyze}
                  className="w-full btn-neutral text-[16px] py-3.5 flex items-center justify-center gap-2.5">
                  <FileText className="w-4 h-4" strokeWidth={1.5} />
                  Analyze Petition
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 p-4 rounded-[16px] bg-[rgba(250,61,29,0.06)]">
              <AlertCircle className="w-4 h-4 text-spectrum-red flex-shrink-0 mt-0.5" />
              <p className="text-[14px] text-spectrum-red">{error}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
