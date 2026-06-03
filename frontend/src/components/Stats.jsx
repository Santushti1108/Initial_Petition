import { useEffect, useState, useRef } from 'react'

function AnimatedNumber({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const duration = 2000
    const startTime = Date.now()
    let frame
    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [started, target])

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

const stats = [
  { value: 5, suffix: 'Cr+', label: 'Cases Pending', sub: 'in Indian Courts' },
  { value: 70, suffix: '%', label: 'Undertrial', sub: 'Prisoners awaiting trial' },
  { value: 30, suffix: '+', label: 'Years', sub: 'to clear backlog' },
  { value: 45, suffix: '', label: 'Days', sub: 'avg. online resolution' },
]

export default function Stats() {
  return (
    <section id="stats" className="py-24 bg-snow">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-heading-lg">
            Crunch the <span className="text-slate italic">Numbers</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-8">
              <div className="text-heading text-ink mb-1">
                <AnimatedNumber target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-[14px] font-medium text-ink mb-0.5">{s.label}</div>
              <div className="text-[14px] text-slate">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 h-px bg-fog max-w-[800px] mx-auto" />
      </div>
    </section>
  )
}
