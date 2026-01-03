// Virtual Chemistry Lab - Main App Component

import { useEffect, useState } from 'react';
import { Scene } from './components/Scene';
import { ChemicalShelf } from './components/ChemicalShelf';
import { ReactionNotification } from './components/ReactionNotification';
import { HomeScreen } from './components/HomeScreen';
import { ObservationPanel } from './components/ObservationPanel';
import { SafetyWarningPopup } from './components/SafetyWarningPopup';
import { CompletionPopup } from './components/CompletionPopup';
import { LabRecordModal } from './components/LabRecordModal';
import { MobileStepIndicator } from './components/MobileStepIndicator';
import { useLabStore } from './store/labStore';
import { SoundManager } from './core/SoundManager';
import { getAllExperiments } from './core/experiments';
import './index.css';

function VesselStatusPanel() {
  const vessels = useLabStore((state) => state.vessels);
  const selectedVesselId = useLabStore((state) => state.selectedVesselId);
  const selectVessel = useLabStore((state) => state.selectVessel);
  const clearVessel = useLabStore((state) => state.clearVessel);

  return (
    <div className="glass-panel p-4 min-w-[280px] max-h-[400px] overflow-y-auto">
      <h3 className="text-lg font-semibold text-cyan-300 mb-3">🧪 Vessels</h3>
      <div className="space-y-4">
        {Array.from(vessels.values()).map((vessel) => {
          const isSelected = vessel.id === selectedVesselId;
          return (
            <div
              key={vessel.id}
              className={`p-3 rounded-lg cursor-pointer transition-all ${isSelected
                ? 'bg-cyan-500/20 border border-cyan-400/50'
                : 'bg-white/5 border border-transparent hover:bg-white/10'
                }`}
              onClick={() => selectVessel(vessel.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium capitalize">
                  {vessel.name || `${vessel.type} ${vessel.id.split('_')[1] || ''}`}
                </span>
                {isSelected && (
                  <span className="text-xs bg-cyan-500 text-black px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>

              {/* Volume bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Volume</span>
                  <span className="font-mono">
                    {Math.round(vessel.currentVolume)} / {vessel.capacity} ml
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                    style={{ width: `${(vessel.currentVolume / vessel.capacity) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tilt indicator */}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Tilt</span>
                <span className={`font-mono ${vessel.tiltAngle > 45 ? 'text-orange-400' : 'text-gray-300'}`}>
                  {Math.round(vessel.tiltAngle)}°
                  {vessel.tiltAngle > 45 && ' ⚠️ Pouring'}
                </span>
              </div>

              {/* Temperature indicator */}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Temp</span>
                <span className={`font-mono ${vessel.temperature > 80 ? 'text-red-400' : vessel.temperature > 50 ? 'text-orange-400' : 'text-gray-300'}`}>
                  {Math.round(vessel.temperature)}°C
                  {vessel.temperature >= 100 && ' 🔥 Boiling!'}
                </span>
              </div>

              {/* Contents */}
              <div className="text-sm">
                <span className="text-gray-400">Contents: </span>
                <span className="text-gray-200">
                  {vessel.contents.length > 0
                    ? vessel.contents.map((c) => c.chemical.name).join(', ')
                    : 'Empty'}
                </span>
              </div>

              {/* Quick actions for selected vessel */}
              {isSelected && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearVessel(vessel.id);
                    }}
                    className="flex-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 py-1.5 px-2 rounded transition-all"
                  >
                    🗑️ Empty
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const isPouringActive = useLabStore((state) => state.isPouringActive);
  const activeEffects = useLabStore((state) => state.activeEffects);
  const bunsenBurnerOn = useLabStore((state) => state.bunsenBurnerOn);
  const toggleBunsenBurner = useLabStore((state) => state.toggleBunsenBurner);
  const experimentMode = useLabStore((state) => state.experimentMode);
  const showLab = useLabStore((state) => state.showLab);
  const currentExperiment = useLabStore((state) => state.currentExperiment);
  const goToHomeScreen = useLabStore((state) => state.goToHomeScreen);
  const loadExperiment = useLabStore((state) => state.loadExperiment);
  const markExperimentComplete = useLabStore((state) => state.markExperimentComplete);
  const showCompletionPopupStore = useLabStore((state) => state.showCompletionPopup);
  const dishCracked = useLabStore((state) => state.dishCracked);

  // Modal states - use store's popup state for auto-completion support
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [showLabRecordModal, setShowLabRecordModal] = useState(false);

  // Mobile UI state
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'chemicals' | 'steps' | 'burner'>('chemicals');
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // useLabStore.getState().initializeStore();
    console.log("deployment-version-check: v4.9-mobile-fix-" + Date.now());
  }, []);

  // Sync popup state with store for auto-completion
  useEffect(() => {
    if (showCompletionPopupStore) {
      // Delay showing the popup for 3 seconds
      const timer = setTimeout(() => {
        setShowCompletionPopup(true);
        // Reset store state after showing
        useLabStore.setState({ showCompletionPopup: false });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showCompletionPopupStore]);

  // Initialize audio on first interaction
  useEffect(() => {
    const initAudio = () => {
      SoundManager.initialize();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Handle experiment completion
  const handleMarkComplete = () => {
    if (currentExperiment) {
      markExperimentComplete(currentExperiment.id);
      setShowCompletionPopup(true);
    }
  };

  // Handle next experiment
  const handleNextExperiment = () => {
    if (currentExperiment) {
      const allExperiments = getAllExperiments();
      const currentIndex = allExperiments.findIndex(e => e.id === currentExperiment.id);
      if (currentIndex < allExperiments.length - 1) {
        setShowCompletionPopup(false);
        loadExperiment(allExperiments[currentIndex + 1].id);
      }
    }
  };

  // Show HomeScreen if showLab is false
  if (!showLab) {
    return <HomeScreen />;
  }

  // Render experiment lab or sandbox
  const isGuidedMode = experimentMode === 'guided' && currentExperiment !== null;

  // ========== MOBILE LAYOUT ==========
  if (isMobile) {
    return (
      <div className="w-full h-full relative flex flex-col">
        {/* Compact Header */}
        <div className="glass-panel p-2 flex items-center justify-between z-10" style={{ minHeight: '44px' }}>
          <button
            onClick={goToHomeScreen}
            className="text-gray-400 hover:text-white transition-colors text-sm px-2"
          >
            ← Back
          </button>
          <h1 className="text-sm font-bold text-cyan-400 truncate flex-1 text-center px-2">
            {isGuidedMode ? currentExperiment?.title : '🧪 3D Chemistry Lab'}
          </h1>
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="text-cyan-400 text-lg px-2"
          >
            {drawerOpen ? '▼' : '▲'}
          </button>
        </div>

        {/* 3D Scene - takes remaining space */}
        <div className="flex-1 relative" style={{ minHeight: '200px' }}>
          {isGuidedMode && <MobileStepIndicator />}

          <Scene className="w-full h-full" isMobile={true} />
          <ReactionNotification />

          {/* Floating status indicators */}
          {isPouringActive && (
            <div className="absolute top-2 left-2 bg-orange-500/80 text-white text-xs px-2 py-1 rounded-full">
              ● Pouring...
            </div>
          )}
          {activeEffects.length > 0 && (
            <div className="absolute top-2 right-2 bg-purple-500/80 text-white text-xs px-2 py-1 rounded-full">
              ⚗️ Reacting!
            </div>
          )}
        </div>

        {/* Collapsible Bottom Drawer */}
        {drawerOpen && (
          <div className="glass-panel z-20" style={{ maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
            {/* Tab Navigation */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('chemicals')}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'chemicals' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
              >
                🧪 Chemicals
              </button>
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'steps' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
              >
                📋 Steps
              </button>
              {/* Only show Burner tab for experiments that need heating, and dish NOT cracked */}
              {(experimentMode === 'sandbox' || currentExperiment?.apparatus?.includes('burner')) && !dishCracked && (
                <button
                  onClick={() => setActiveTab('burner')}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'burner' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}
                >
                  🔥 Burner
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-2">
              {activeTab === 'chemicals' && (
                <div className="mobile-shelf">
                  <ChemicalShelf />
                </div>
              )}
              {activeTab === 'steps' && (
                <div className="mobile-steps">
                  {isGuidedMode ? (
                    <ObservationPanel onMarkComplete={handleMarkComplete} layout="mobile" />
                  ) : (
                    <div className="text-sm text-gray-400 p-2">
                      <p className="mb-2">🧪 Free Mode - Mix chemicals to see reactions!</p>
                      <ul className="text-xs space-y-1">
                        <li>• Tap beaker → Add chemicals</li>
                        <li>• Drag to tilt & pour</li>
                        <li>• Use burner to heat</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'burner' && (
                <div className="p-2">
                  <button
                    onClick={toggleBunsenBurner}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-lg transition-all ${bunsenBurnerOn
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                      }`}
                  >
                    {bunsenBurnerOn ? '🔥 Burner ON' : '⚫ Burner OFF'}
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Tap to toggle heat
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completion Popup */}
        <CompletionPopup
          isOpen={showCompletionPopup}
          onClose={() => setShowCompletionPopup(false)}
          onViewLabRecord={() => {
            setShowCompletionPopup(false);
            setShowLabRecordModal(true);
          }}
          onNextExperiment={handleNextExperiment}
        />

        {/* Safety Warning Popup */}
        <SafetyWarningPopup />

        {/* Lab Record Modal */}
        <LabRecordModal
          isOpen={showLabRecordModal}
          onClose={() => setShowLabRecordModal(false)}
        />
      </div>
    );
  }

  // ========== DESKTOP LAYOUT (Original) ==========
  return (
    <div className="w-full h-full relative">
      {/* 3D Scene */}
      <Scene className="w-full h-full" />

      {/* Reaction Notification */}
      <ReactionNotification />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none">
        <div className="flex justify-between items-start gap-4">
          {/* Title / Experiment Header */}
          <div className="glass-panel p-4 pointer-events-auto">
            {isGuidedMode ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={goToHomeScreen}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Back to experiments"
                  >
                    ← Back
                  </button>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  {currentExperiment?.title}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Class {currentExperiment?.classLevel} • {currentExperiment?.chapter}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                  🧪 3D Chemistry Lab
                </h1>
                <p className="text-sm text-gray-400 mt-1">Free Exploration Mode</p>
                <button
                  onClick={goToHomeScreen}
                  className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  ← Back to Experiments
                </button>
              </>
            )}
            {isPouringActive && (
              <div className="mt-2 text-orange-400 text-sm flex items-center gap-2">
                <span className="animate-pulse">●</span>
                Pouring in progress...
              </div>
            )}
            {activeEffects.length > 0 && (
              <div className="mt-2 text-purple-400 text-sm flex items-center gap-2">
                <span className="animate-pulse">⚗️</span>
                Reaction in progress!
              </div>
            )}
          </div>

          {/* Right panel: Vessels + Chemical Shelf */}
          <div className="pointer-events-auto space-y-4">
            <VesselStatusPanel />

            <ChemicalShelf />
          </div>
        </div>
      </div>

      {/* Left side: Observation Panel (Guided mode) or Instructions (Sandbox) */}
      <div className="absolute bottom-6 left-6 pointer-events-none">
        <div className="pointer-events-auto max-w-[360px]">
          {isGuidedMode ? (
            <ObservationPanel onMarkComplete={handleMarkComplete} />
          ) : (
            <div className="glass-panel p-4">
              <h3 className="text-sm font-semibold text-cyan-300 mb-2">📖 How to Use</h3>
              <ol className="text-sm text-gray-300 space-y-1.5 list-decimal list-inside">
                <li>Click a beaker to <strong>select</strong> it</li>
                <li>Use the <strong>Chemical Shelf</strong> to add chemicals</li>
                <li><strong>Drag up/down</strong> on beaker to tilt</li>
                <li><strong>Shift+drag</strong> to move beaker around!</li>
                <li>Pour into another beaker to <strong>mix chemicals</strong></li>
              </ol>
              <div className="mt-3 pt-3 border-t border-white/10">
                <h4 className="text-xs font-semibold text-purple-300 mb-1">🔬 Try These Reactions:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• <strong>HCl + NaOH</strong> → Neutralization (heat! 🔥)</li>
                  <li>• <strong>HCl + Zinc</strong> → Bubbles! 🫧</li>
                  <li>• <strong>Indicator + NaOH</strong> → Pink color! 🩷</li>
                  <li>• <strong>BaCl₂ + H₂SO₄</strong> → White precipitate! ⬜</li>
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <h4 className="text-xs font-semibold text-orange-300 mb-1">🔥 Heating:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Add <strong>Water</strong> to a beaker</li>
                  <li>• Turn on the <strong>Bunsen burner</strong></li>
                  <li>• Drag beaker near the flame to heat!</li>
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <h4 className="text-xs font-semibold text-gray-400 mb-1">Camera Controls</h4>
                <ul className="text-xs text-gray-400 space-y-0.5">
                  <li>• Drag to rotate • Scroll to zoom</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion Popup */}
      <CompletionPopup
        isOpen={showCompletionPopup}
        onClose={() => setShowCompletionPopup(false)}
        onViewLabRecord={() => {
          setShowCompletionPopup(false);
          setShowLabRecordModal(true);
        }}
        onNextExperiment={handleNextExperiment}
      />

      {/* Safety Warning Popup */}
      <SafetyWarningPopup />

      {/* Lab Record Modal */}
      <LabRecordModal
        isOpen={showLabRecordModal}
        onClose={() => setShowLabRecordModal(false)}
      />
    </div>
  );
}

export default App;
