import {
  CheckCircle2, XCircle, AlertTriangle, FileText, BarChart3,
  Scale, BookOpen, ChevronDown, ChevronUp, X, TrendingUp,
  Shield, Gavel, Info
} from 'lucide-react'
import { useState } from 'react'

function ScoreGauge({ score, verdict }) {
  const c = 2 * Math.PI * 54
  const offset = c - (score / 100) * c
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#eab308' : '#fa3d1d'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#efefef" strokeWidth="8" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
            className="progress-ring-fill" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[36px] font-light text-ink tracking-[-1px]">{score}</span>
          <span className="text-[10px] text-slate">/ 100</span>
        </div>
      </div>
      <div className={`mt-3 px-4 py-1 rounded-full text-[13px] font-medium ${
        score >= 70 ? 'bg-[rgba(34,197,94,0.08)] text-[#22c55e]' :
        score >= 45 ? 'bg-[rgba(234,179,8,0.08)] text-[#eab308]' :
        'bg-[rgba(250,61,29,0.08)] text-[#fa3d1d]'
      }`}>{verdict}</div>
    </div>
  )
}

function Bar({ label, value, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[13px]">
        <span className="text-graphite">{label}</span>
        <span className="font-medium text-ink">{value}%</span>
      </div>
      <div className="h-[6px] rounded-full bg-fog overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="frosted-card !p-0 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-canvas/50 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <Icon className="w-[18px] h-[18px] text-ink" strokeWidth={1.5} />
          <span className="text-[16px] font-medium text-ink">{title}</span>
          {badge && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-canvas text-graphite">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-steel" /> : <ChevronDown className="w-4 h-4 text-steel" />}
      </button>
      {open && <div className="px-8 pb-6 border-t border-fog pt-5">{children}</div>}
    </div>
  )
}

export default function AnalysisResults({ result, onClear }) {
  if (!result) return null
  const { summary, sentiment, sections, critical_elements, legal_provisions,
          case_citations, viability, stats } = result

  return (
    <section className="py-16 bg-snow animate-fade-up">
      <div className="max-w-[800px] mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-heading-lg !text-[40px]">Analysis Report</h2>
            <p className="text-[14px] text-slate mt-1">{stats.word_count.toLocaleString()} words analyzed</p>
          </div>
          <button onClick={onClear}
            className="w-9 h-9 rounded-[10px] bg-fog hover:bg-pebble flex items-center justify-center text-ash hover:text-ink transition-all duration-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Viability — hero card */}
          <div className="frosted-card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] spectrum-gradient" />
            <div className="flex flex-col md:flex-row items-center gap-8 pt-4">
              <ScoreGauge score={viability.score} verdict={viability.verdict} />
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-[22px] font-normal text-ink tracking-[-0.44px] mb-3">Court Viability</h3>
                <p className="text-[14px] text-graphite leading-[1.5] mb-4">{viability.verdict_detail}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {[
                    `${stats.word_count.toLocaleString()} words`,
                    `${stats.sections_found}/${stats.sections_total} sections`,
                    `${stats.provisions_cited} provisions`,
                    `${stats.cases_cited} citations`,
                  ].map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-canvas text-[12px] text-graphite">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <Section title="Petition Summary" icon={FileText} defaultOpen>
            <p className="text-[14px] text-graphite leading-[1.6] whitespace-pre-wrap">{summary}</p>
          </Section>

          {/* Issues & Strengths */}
          <Section title="Issues & Strengths" icon={AlertTriangle} defaultOpen
            badge={`${viability.issues.length} issues`}>
            <div className="space-y-5">
              {viability.issues.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-[#fa3d1d] uppercase tracking-[0.08em] mb-3">Issues Found</div>
                  <div className="space-y-2">
                    {viability.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-[10px] bg-[rgba(250,61,29,0.03)]">
                        <div className={`w-[5px] h-[5px] rounded-full mt-1.5 flex-shrink-0 ${
                          issue.startsWith('CRITICAL') ? 'bg-[#fa3d1d]' :
                          issue.startsWith('HIGH') ? 'bg-marigold' : 'bg-steel'
                        }`} />
                        <span className="text-[14px] text-graphite leading-[1.5]">{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viability.strengths.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-[#22c55e] uppercase tracking-[0.08em] mb-3">Strengths</div>
                  <div className="space-y-2">
                    {viability.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-[10px] bg-[rgba(34,197,94,0.03)]">
                        <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <span className="text-[14px] text-graphite leading-[1.5]">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Structure */}
          <Section title="Petition Structure" icon={Shield} badge={`${sections.found.length} found`}>
            <div className="grid grid-cols-2 gap-2">
              {[...sections.found.map(s => ({ name: s, ok: true })),
                ...sections.missing.map(s => ({ name: s, ok: false }))]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(({ name, ok }) => (
                  <div key={name} className={`flex items-center gap-2.5 p-3 rounded-[10px] ${
                    ok ? 'bg-[rgba(34,197,94,0.03)]' : 'bg-[rgba(250,61,29,0.03)]'
                  }`}>
                    {ok ? <CheckCircle2 className="w-4 h-4 text-[#22c55e]" strokeWidth={1.5} />
                        : <XCircle className="w-4 h-4 text-[#fa3d1d]" strokeWidth={1.5} />}
                    <span className="text-[14px] text-graphite capitalize">{name.replace(/_/g, ' ')}</span>
                  </div>
                ))}
            </div>
          </Section>

          {/* Sentiment */}
          <Section title="Sentiment Analysis" icon={BarChart3}>
            <div className="space-y-4">
              <Bar label="Positive" value={sentiment.positive_pct} color="#22c55e" />
              <Bar label="Neutral" value={sentiment.neutral_pct} color="#aeaeae" />
              <Bar label="Negative" value={sentiment.negative_pct} color="#fa3d1d" />
              <div className="mt-4 p-4 rounded-[10px] bg-canvas">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-3.5 h-3.5 text-ash" strokeWidth={1.5} />
                  <span className="text-[13px] font-medium text-ink">Tone Assessment</span>
                </div>
                <p className="text-[13px] text-graphite leading-[1.5]">
                  {sentiment.overall === 'positive'
                    ? 'The petition maintains a constructive, measured tone — favorable for judicial reception.'
                    : sentiment.overall === 'negative'
                    ? 'The petition has a notably negative/accusatory tone. Consider moderating the language.'
                    : 'The petition maintains a neutral, factual tone — appropriate for legal filings.'}
                </p>
              </div>
            </div>
          </Section>

          {/* Legal References */}
          {(legal_provisions.length > 0 || case_citations.length > 0) && (
            <Section title="Legal References" icon={BookOpen} badge={`${legal_provisions.length + case_citations.length}`}>
              <div className="space-y-4">
                {legal_provisions.length > 0 && (
                  <div>
                    <div className="text-[10px] font-medium text-slate uppercase tracking-[0.08em] mb-2">Provisions Cited</div>
                    <div className="flex flex-wrap gap-2">
                      {legal_provisions.map((p, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full bg-canvas text-[13px] text-graphite">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {case_citations.length > 0 && (
                  <div>
                    <div className="text-[10px] font-medium text-slate uppercase tracking-[0.08em] mb-2">Case Citations</div>
                    <div className="flex flex-wrap gap-2">
                      {case_citations.map((c, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full bg-canvas text-[13px] text-graphite">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Critical Elements */}
          <Section title="Critical Legal Elements" icon={TrendingUp}>
            <div className="space-y-4">
              {Object.entries(critical_elements.present).length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-[#22c55e] uppercase tracking-[0.08em] mb-2">Addressed</div>
                  <div className="space-y-2">
                    {Object.entries(critical_elements.present).map(([key, desc]) => (
                      <div key={key} className="flex items-center gap-3 p-3 rounded-[10px] bg-[rgba(34,197,94,0.03)]">
                        <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0" strokeWidth={1.5} />
                        <span className="text-[14px] text-graphite">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {Object.entries(critical_elements.absent).length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-[#fa3d1d] uppercase tracking-[0.08em] mb-2">Not Addressed</div>
                  <div className="space-y-2">
                    {Object.entries(critical_elements.absent).map(([key, info]) => (
                      <div key={key} className="flex items-center gap-3 p-3 rounded-[10px] bg-[rgba(250,61,29,0.03)]">
                        <XCircle className="w-4 h-4 text-[#fa3d1d] flex-shrink-0" strokeWidth={1.5} />
                        <span className="text-[14px] text-graphite flex-1">{info.description}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          info.severity === 'critical' ? 'bg-[rgba(250,61,29,0.08)] text-[#fa3d1d]' :
                          info.severity === 'high' ? 'bg-[rgba(255,176,5,0.1)] text-marigold' :
                          'bg-canvas text-ash'
                        }`}>{info.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </section>
  )
}
