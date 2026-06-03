import { Upload, Cpu, FileCheck } from 'lucide-react'

const steps = [
  {
    icon: Upload,
    num: '01',
    title: 'Upload',
    desc: 'Drag & drop your petition PDF. We support all standard legal documents up to 16MB.',
  },
  {
    icon: Cpu,
    num: '02',
    title: 'Analyze',
    desc: 'NLP engine extracts text, analyzes structure, identifies gaps, and evaluates court viability.',
  },
  {
    icon: FileCheck,
    num: '03',
    title: 'Report',
    desc: 'Get a comprehensive report with summary, issues, viability score, and specific recommendations.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-snow">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-heading-lg">
            How it <span className="text-slate italic">works</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.num} className="frosted-card text-center">
              <div className="text-[48px] font-light text-fog leading-none mb-5 tracking-[-2px]">{s.num}</div>
              <div className="w-14 h-14 mx-auto rounded-full bg-canvas flex items-center justify-center mb-5">
                <s.icon className="w-6 h-6 text-ink" strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-medium text-ink mb-2">{s.title}</h3>
              <p className="text-[14px] text-graphite leading-[1.5]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
