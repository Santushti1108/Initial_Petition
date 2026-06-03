import {
  FileText, AlertTriangle, CheckCircle2, BarChart3,
  BookOpen, Scale
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'AI Summarization',
    desc: 'Concise summary using TextRank NLP — identifies the most critical sentences in your petition.',
  },
  {
    icon: AlertTriangle,
    title: 'Issue Detection',
    desc: 'Identifies missing sections, procedural gaps, and structural weaknesses that could lead to dismissal.',
  },
  {
    icon: CheckCircle2,
    title: 'Court Viability',
    desc: 'A data-driven score on whether your petition will stand in court, with detailed reasoning.',
  },
  {
    icon: BarChart3,
    title: 'Sentiment Analysis',
    desc: 'Analyzes tone — aggressive or passive language can affect how judges receive your petition.',
  },
  {
    icon: BookOpen,
    title: 'Legal Provisions',
    desc: 'Automatically extracts all cited sections, articles, acts, and case references.',
  },
  {
    icon: Scale,
    title: 'Recommendations',
    desc: 'Prioritized recommendations on what to fix and improve before filing.',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-canvas">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-4">
          <span className="inline-block px-5 py-2 rounded-[16px] bg-[rgba(0,0,0,0.04)] text-[14px] font-medium text-ink mb-8">
            Platform Features
          </span>
        </div>
        <div className="text-center mb-16">
          <h2 className="text-heading-lg">
            Everything you need to<br />
            <span className="text-slate italic">perfect your petition</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="frosted-card group transition-all duration-200 hover:shadow-[0_0_16px_rgba(0,0,0,0.1)]">
              <f.icon className="w-6 h-6 text-ink mb-5" strokeWidth={1.5} />
              <h3 className="text-heading-sm !text-[18px] mb-2">{f.title}</h3>
              <p className="text-[16px] text-graphite leading-[1.5]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
