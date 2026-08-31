import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { SanjitSectionView } from "./modules/sanjit/SanjitSectionView";
import { PraveenSectionView } from "./modules/praveen/PraveenSectionView";
import { NishSectionView } from "./modules/nish/NishSectionView";
import { ArchitectureOverview } from "./components/ArchitectureOverview";
import { Language } from "./locales/i18n";

export function App() {
  const [currentModule, setCurrentModule] = useState<"sanjit" | "praveen" | "nish" | "architecture">("sanjit");
  const [currentLang, setCurrentLang] = useState<Language>("en");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentModule={currentModule}
        onModuleChange={setCurrentModule}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentModule === "sanjit" && (
          <SanjitSectionView currentLang={currentLang} patientId="patient-101" />
        )}
        {currentModule === "praveen" && (
          <PraveenSectionView currentLang={currentLang} patientId="patient-101" />
        )}
        {currentModule === "nish" && (
          <NishSectionView currentLang={currentLang} />
        )}
        {currentModule === "architecture" && (
          <ArchitectureOverview />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-400">Gurugale Dementia Care Platform</span>
            <span>• Built for Section 2 (Sanjit), Section 1 (Praveen), Section 3 (Nischal)</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono">Section 0 Shared Data Contract Certified</span>
            <span>•</span>
            <span className="text-slate-400 font-mono">Assam / NER Multi-Lingual Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
