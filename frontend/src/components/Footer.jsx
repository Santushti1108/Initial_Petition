import { Scale } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-snow border-t border-fog">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-[18px] h-[18px] text-ink" strokeWidth={1.5} />
            </div>
            <p className="text-[14px] text-graphite max-w-[360px] leading-[1.5]">
              AI-powered petition analysis for the Indian legal system.
              Helping lawyers and litigants file stronger petitions.
            </p>
          </div>

          <div>
            <h4 className="text-[14px] font-medium text-ink mb-4">Product</h4>
            <div className="space-y-2.5">
              {['Features', 'How It Works', 'Analyze'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                   className="block text-[14px] text-graphite hover:text-ink transition-colors duration-200">
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[14px] font-medium text-ink mb-4">Legal</h4>
            <div className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Disclaimer'].map((item) => (
                <a key={item} href="#" className="block text-[14px] text-graphite hover:text-ink transition-colors duration-200">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Spectrum strip */}
        <div className="h-[2px] spectrum-gradient rounded-full mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-slate">
            &copy; {new Date().getFullYear()} NyayaLens. Built for Indian Justice.
          </p>
          <p className="text-[13px] text-steel">
            NyayaLens is an AI tool and does not constitute legal advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
