import { Routes, Route } from "react-router-dom";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Landing from "./pages/LandingPage";
import { ThemeProvider } from "./components/ui/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/history" element={<History />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </ThemeProvider>
    
  );
  
}

export default App;