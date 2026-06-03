import { useState, useEffect } from 'react'
import { Scale, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const links = ['Features', 'How It Works', 'Analyze']

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-200 ${
      scrolled ? 'bg-[#efefef]/90 backdrop-blur-[24px] shadow-[0_0_8px_rgba(0,0,0,0.08)]' : 'bg-transparent'
    }`}>
      <div className="max-w-[1200px] mx-auto px-6 h-[52px] flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group">
          <Scale className="w-[18px] h-[18px] text-ink" />
        </a>

        <div className="hidden md:flex items-center gap-5">
          {links.map((label) => (
            <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
               className="text-[14px] font-normal text-ink transition-colors duration-200 hover:text-graphite">
              {label}
            </a>
          ))}
        </div>

        <a href="#analyze" className="hidden md:block btn-neutral text-[14px]">
          Get Started
        </a>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-ink">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-snow/90 backdrop-blur-[24px] border-t border-fog px-6 py-5 space-y-3">
          {links.map((label) => (
            <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
               onClick={() => setMobileOpen(false)}
               className="block text-[16px] text-ink py-1.5">
              {label}
            </a>
          ))}
          <a href="#analyze" onClick={() => setMobileOpen(false)} className="block btn-neutral text-center mt-4">
            Get Started
          </a>
        </div>
      )}
    </nav>
  )
}
