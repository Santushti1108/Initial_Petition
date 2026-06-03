import { useState, useRef } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Stats from './components/Stats'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import UploadSection from './components/UploadSection'
import AnalysisResults from './components/AnalysisResults'
import Footer from './components/Footer'

function App() {
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const resultsRef = useRef(null)

  const handleResult = (data) => {
    setAnalysisResult(data)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
  }

  return (
    <div className="min-h-screen bg-lavender-50">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <UploadSection
        onResult={handleResult}
        isAnalyzing={isAnalyzing}
        setIsAnalyzing={setIsAnalyzing}
      />
      <div ref={resultsRef}>
        {analysisResult && (
          <AnalysisResults
            result={analysisResult}
            onClear={() => setAnalysisResult(null)}
          />
        )}
      </div>
      <Footer />
    </div>
  )
}

export default App
