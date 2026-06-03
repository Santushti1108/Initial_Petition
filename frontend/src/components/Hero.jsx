import { ArrowDown } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-canvas">
      {/* Spectrum ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] spectrum-glow rounded-full" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-20 pb-16 text-center">
        {/* Subtitle */}
        <p className="text-[18px] font-normal text-graphite leading-[1.33] mb-6">
          AI-powered legal petition analysis
        </p>

        {/* Display headline */}
        <h1 className="text-display mb-8 max-w-[800px] mx-auto">
          Analyze your petition{' '}
          <br className="hidden md:block" />
          before the court does
        </h1>

        {/* CTA */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <a href="#analyze" className="btn-neutral text-[16px] px-8 py-3.5">
            Upload Petition
          </a>
        </div>

        {/* Floating product preview card */}
        <div className="max-w-[560px] mx-auto">
          <div className="frosted-card text-left">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-fog">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-[13px] text-slate font-normal">petition_analysis.pdf</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[10px] bg-canvas flex items-center justify-center">
                  <span className="text-[18px] font-medium text-ink">72</span>
                </div>
                <div>
                  <div className="text-[14px] font-medium text-ink">Court Viability Score</div>
                  <div className="text-[13px] text-[#22c55e] font-normal">Likely to Stand</div>
                </div>
              </div>

              <div className="h-px bg-fog" />

              <div className="space-y-2.5">
                {[
                  { ok: true, text: 'Parties identified' },
                  { ok: true, text: 'Jurisdiction stated' },
                  { ok: true, text: 'Prayer clause present' },
                  { ok: false, text: 'Verification missing' },
                  { ok: null, text: 'No case citations' },
                ].map(({ ok, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <div className={`w-[6px] h-[6px] rounded-full ${
                      ok === true ? 'bg-[#22c55e]' : ok === false ? 'bg-[#fa3d1d]' : 'bg-marigold'
                    }`} />
                    <span className="text-[14px] text-graphite">{text}</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-fog" />

              <div className="bg-canvas rounded-[10px] p-4">
                <div className="text-[10px] font-medium text-slate uppercase tracking-[0.08em] mb-1.5">Summary</div>
                <div className="text-[14px] text-graphite leading-[1.5]">
                  The petitioner challenges the acquisition order on grounds of procedural irregularity and violation of fundamental rights under Article 14...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating accent badges */}
        <div className="hidden md:block absolute bottom-32 left-[8%]">
          <div className="frosted-card !p-4 !rounded-[16px] animate-float">
            <div className="text-[10px] text-slate uppercase tracking-[0.08em] mb-0.5">Provisions</div>
            <div className="text-[14px] font-medium text-ink">Section 11, Art. 14</div>
          </div>
        </div>
        <div className="hidden md:block absolute top-48 right-[8%]">
          <div className="frosted-card !p-4 !rounded-[16px] animate-float" style={{ animationDelay: '1s' }}>
            <div className="text-[10px] text-slate uppercase tracking-[0.08em] mb-0.5">Sentiment</div>
            <div className="text-[14px] font-medium text-ink">Neutral — Factual</div>
          </div>
        </div>
      </div>

      <a href="#stats" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-steel hover:text-ink transition-colors duration-200 animate-bounce">
        <ArrowDown className="w-5 h-5" />
      </a>
    </section>
  )
}
