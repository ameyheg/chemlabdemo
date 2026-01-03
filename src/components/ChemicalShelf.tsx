// ChemicalShelf - UI panel for adding different chemicals to vessels

import { useLabStore } from '../store/labStore';
import { CHEMICALS } from '../core/ReactionManager';
import type { Chemical, ChemicalType } from '../core/types';

export function ChemicalShelf() {
    const selectedVesselId = useLabStore((state) => state.selectedVesselId);
    const fillVessel = useLabStore((state) => state.fillVessel);
    const selectVessel = useLabStore((state) => state.selectVessel);
    const vessels = useLabStore((state) => state.vessels);

    // Experiment mode state
    const experimentMode = useLabStore((state) => state.experimentMode);
    const currentExperiment = useLabStore((state) => state.currentExperiment);
    const addChemicalToExperiment = useLabStore((state) => state.addChemicalToExperiment);
    const checkExperimentReaction = useLabStore((state) => state.checkExperimentReaction);
    const addedChemicals = useLabStore((state) => state.addedChemicals);
    const placeApparatus = useLabStore((state) => state.addApparatusToExperiment);
    const addVessel = useLabStore((state) => state.addVessel);
    const placedApparatus = useLabStore((state) => state.placedApparatus);

    // Salt-dissolution experiment state - matches 2D HTML
    const saltTested = useLabStore((state) => state.saltTested);
    const sandTested = useLabStore((state) => state.sandTested);
    const resetAfterSaltTest = useLabStore((state) => state.resetAfterSaltTest);

    // Physical-chemical experiment state - matches 2D HTML
    const iceTested = useLabStore((state) => state.iceTested);
    const paperTested = useLabStore((state) => state.paperTested);
    const magnesiumTested = useLabStore((state) => state.magnesiumTested);

    // Actions state
    const experimentActions = useLabStore((state) => state.experimentActions);
    const performExperimentAction = useLabStore((state) => state.performExperimentAction);
    const isAutoPouring = useLabStore((state) => state.isAutoPouring);
    const setAutoPouring = useLabStore((state) => state.setAutoPouring);

    // Burner state - only for heating experiments
    const bunsenBurnerOn = useLabStore((state) => state.bunsenBurnerOn);
    const toggleBunsenBurner = useLabStore((state) => state.toggleBunsenBurner);

    // Neutralization actions
    const startNeutralizationAnimation = useLabStore((state) => state.startNeutralizationAnimation);
    const neutralizationAnimating = useLabStore((state) => state.neutralizationAnimating);
    const hasNeutralizationCompleted = useLabStore((state) => state.neutralizationComplete);

    // Reset state
    const showResetPrompt = useLabStore((state) => state.showResetPrompt);
    const resetExperiment = useLabStore((state) => state.resetExperiment);
    const dishCracked = useLabStore((state) => state.dishCracked);
    const needsHeating = currentExperiment?.apparatus?.includes('burner') ||
        currentExperiment?.id === 'evaporation' ||
        currentExperiment?.id === 'physical-chemical';

    const selectedVessel = selectedVesselId ? vessels.get(selectedVesselId) : null;
    const currentVolume = selectedVessel?.currentVolume ?? 0;
    const capacity = selectedVessel?.capacity ?? 500;
    const remainingSpace = capacity - currentVolume;

    const isGuidedMode = experimentMode === 'guided' && currentExperiment !== null;

    // Get emoji for chemical based on ID or name
    const getChemicalEmoji = (id: string): string => {
        const emojiMap: Record<string, string> = {
            'water': '💧',
            'salt': '🧂',
            'sand': '🏖️',
            'muddy-water': '🌊',
            'salt-solution': '💧',
            'ice': '🧊',
            'paper': '📄',
            'magnesium': '⚡',
            'hcl': '🧪',
            'hydrochloric_acid': '🧪',
            'naoh': '🧫',
            'sodium_hydroxide': '🧫',
            'phenolphthalein': '🩷',
            'h2so4': '⚗️',
            'sulfuric_acid': '⚗️',
            'barium_chloride': '🧂',
            'vinegar': '🍶',
            'lemon-juice': '🍋',
            'soap-solution': '🧼',
            'baking-soda': '🥄',
            'blue-litmus': '🔵',
            'red-litmus': '🔴',
            'zinc': '⚙️',
        };
        return emojiMap[id] || '🧪';
    };

    // Infer chemical type from ID
    const inferChemicalType = (id: string): ChemicalType => {
        const typeMap: Record<string, ChemicalType> = {
            'water': 'water',
            'salt': 'salt',
            'sand': 'neutral',
            'hcl': 'acid',
            'naoh': 'base',
            'h2so4': 'acid',
            'phenolphthalein': 'indicator',
            'barium_chloride': 'salt',
            'zinc': 'metal',
            'vinegar': 'acid',
            'lemon-juice': 'acid',
            'soap-solution': 'base',
            'baking-soda': 'base',
        };
        return typeMap[id] || 'neutral';
    };

    // Check if a chemical should be disabled for salt-dissolution experiment
    // This matches exactly the 2D HTML logic at lines 3397-3416
    const isChemicalDisabledForSaltDissolution = (chemId: string): boolean => {
        if (!isGuidedMode || currentExperiment?.id !== 'salt-dissolution') {
            return false; // Not in salt-dissolution, no special rules
        }

        const hasWater = addedChemicals.includes('water');
        const hasSaltOrSand = addedChemicals.includes('salt') || addedChemicals.includes('sand');

        if (chemId === 'water') {
            // Water always available
            return false;
        } else if (chemId === 'salt') {
            // Salt only enabled if:
            // - water is present
            // - salt not yet tested (saltTested === false)
            // - no substance (salt/sand) already added this round
            if (!hasWater) return true;
            if (saltTested) return true; // Already tested salt, disable it
            if (hasSaltOrSand) return true; // Already added a substance
            return false;
        } else if (chemId === 'sand') {
            // Sand only enabled if:
            // - water is present
            // - salt was tested (saltTested === true)
            // - sand not yet tested (sandTested === false)
            // - user has reset after salt test (resetAfterSaltTest === true)
            // - no substance already added this round
            if (!hasWater) return true;
            if (!saltTested) return true; // Must test salt first
            if (sandTested) return true; // Already tested sand
            if (!resetAfterSaltTest) return true; // Must reset after salt test
            if (hasSaltOrSand) return true; // Already added a substance
            return false;
        }
        return false;
    };

    // Check if a chemical should be disabled for physical-chemical experiment
    // Round 1: ice only (needs beaker)
    // Round 2: paper only (needs tongs, after ice tested + reset)
    // Round 3: magnesium only (needs tongs, after paper tested + reset)
    const isChemicalDisabledForPhysicalChemical = (chemId: string): boolean => {
        if (!isGuidedMode || currentExperiment?.id !== 'physical-chemical') {
            return false; // Not in physical-chemical, no special rules
        }

        const hasBeaker = placedApparatus.includes('beaker');
        const hasTongs = placedApparatus.includes('tongs');
        const hasIceInSession = addedChemicals.includes('ice');
        const hasPaperInSession = addedChemicals.includes('paper');
        const hasMagnesiumInSession = addedChemicals.includes('magnesium');

        if (chemId === 'ice') {
            // Ice only enabled in Round 1 (before ice tested), needs beaker
            if (iceTested) return true; // Already tested ice
            if (!hasBeaker) return true; // Needs beaker
            if (hasIceInSession) return true; // Already added ice this session
            return false;
        } else if (chemId === 'paper') {
            // Paper only enabled in Round 2 (after ice tested, before paper tested)
            // Must have reset (ice not in current session), needs tongs
            if (!iceTested) return true; // Must test ice first
            if (paperTested) return true; // Already tested paper
            if (hasIceInSession) return true; // Must reset after ice test
            if (!hasTongs) return true; // Needs tongs
            if (hasPaperInSession) return true; // Already added paper this session
            return false;
        } else if (chemId === 'magnesium') {
            // Magnesium only enabled in Round 3 (after paper tested, before magnesium tested)
            // Must have reset (paper not in current session), needs tongs
            if (!iceTested || !paperTested) return true; // Must complete previous rounds
            if (magnesiumTested) return true; // Already tested magnesium
            if (hasPaperInSession) return true; // Must reset after paper test
            if (!hasTongs) return true; // Needs tongs
            if (hasMagnesiumInSession) return true; // Already added magnesium this session
            return false;
        }

        return false;
    };

    const isChemicalDisabledForNeutralization = (chemId: string): boolean => {
        if (!isGuidedMode || currentExperiment?.id !== 'neutralization') return false;

        if (neutralizationAnimating || hasNeutralizationCompleted) return true;

        // Enforce order: NaOH -> Phenolphthalein -> HCl
        const hasNaOH = addedChemicals.includes('naoh');
        const hasPhenol = addedChemicals.includes('phenolphthalein');

        if (chemId === 'phenolphthalein' && !hasNaOH) return true;

        // HCl requires Phenol AND Dropper
        const hasDropper = placedApparatus.includes('dropper');
        if (chemId === 'hcl' && (!hasPhenol || !hasDropper)) return true;

        return false;
    };

    // Use experiment chemicals in guided mode, sandbox chemicals otherwise
    const getDisplayChemicals = (): (Chemical & { emoji: string; label: string })[] => {
        if (isGuidedMode && currentExperiment) {
            return currentExperiment.chemicals.map(chem => ({
                id: chem.id,
                name: chem.name,
                color: chem.color,
                type: inferChemicalType(chem.id),
                emoji: getChemicalEmoji(chem.id),
                label: chem.name,
            }));
        }
        // Sandbox mode - show all chemicals
        return [
            { ...CHEMICALS.water, emoji: '💧', label: 'Water' },
            { ...CHEMICALS.hydrochloric_acid, emoji: '🧪', label: 'HCl (Acid)' },
            { ...CHEMICALS.sodium_hydroxide, emoji: '🧫', label: 'NaOH (Base)' },
            { ...CHEMICALS.zinc, emoji: '⚙️', label: 'Zinc (Metal)' },
            { ...CHEMICALS.phenolphthalein, emoji: '🩷', label: 'Indicator' },
            { ...CHEMICALS.sulfuric_acid, emoji: '⚗️', label: 'H₂SO₄ (Acid)' },
            { ...CHEMICALS.barium_chloride, emoji: '🧂', label: 'BaCl₂ (Salt)' },
        ];
    };

    const displayChemicals = getDisplayChemicals();

    // Helper to create a beaker vessel
    const createVessel = (type: string) => {
        const id = `${type}_${Date.now()}`;
        return {
            id,
            type: type as any,
            capacity: 250,
            currentVolume: 0,
            tiltAngle: 0,
            temperature: 25,
            contents: [],
            position: [Math.random() * 0.5 - 0.25, 0, Math.random() * 0.5 + 0.5] as [number, number, number]
        };
    };

    const handleAddApparatus = (apparatusId: string) => {
        if (apparatusId === 'beaker') {
            const newVessel = createVessel('beaker');

            // For physical-chemical experiment, place beaker on tripod stand platform
            if (currentExperiment?.id === 'physical-chemical' && placedApparatus.includes('tripod-stand')) {
                // Tripod stand is at [0, 0, 2], platform is at Y=1.0
                newVessel.position = [0, 1.0, 2.0];
            }
            // For evaporation, also place on tripod if available
            else if (currentExperiment?.id === 'evaporation' && placedApparatus.includes('tripod-stand')) {
                newVessel.position = [0, 1.0, 2.0];
            }

            addVessel(newVessel);
            selectVessel(newVessel.id);
            placeApparatus('beaker'); // Also track in placedApparatus so it greys out
        } else if (apparatusId === 'tongs') {
            // Create a tongs "vessel" to hold paper/magnesium
            // Position above burner at [0, 0, 2]
            const tongsVessel = {
                id: `tongs_${Date.now()}`,
                type: 'tongs' as any,
                capacity: 10, // Small capacity for holding items
                currentVolume: 0,
                tiltAngle: 0,
                temperature: 25,
                contents: [],
                position: [0, 1.8, 2] as [number, number, number]
            };
            addVessel(tongsVessel);
            selectVessel(tongsVessel.id);
            placeApparatus('tongs');
        } else {
            placeApparatus(apparatusId);
        }
    };

    const getApparatusEmoji = (id: string) => {
        const map: Record<string, string> = {
            'beaker': '🥛',
            'funnel': '️🌪️',
            'filter-paper': '📄',
            'burner': '🔥',
            'tripod-stand': '🏗️',
            'china-dish': '🥣',
            'test-tube': '🧪',
            'glass-rod': '🥢',
            'dropper': '💧',
            'tongs': '✂️'
        };
        return map[id] || '⚙️';
    };

    const getApparatusLabel = (id: string) => {
        return id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    };

    const handleAddChemical = (chemical: Chemical) => {
        // Neutralization Animation Trigger
        if (isGuidedMode && currentExperiment?.id === 'neutralization' && chemical.id === 'hcl') {
            startNeutralizationAnimation();
            return;
        }

        // Special handling for evaporation experiment - no beaker needed, chemicals go to china dish
        if (isGuidedMode && currentExperiment?.id === 'evaporation') {
            addChemicalToExperiment(chemical.id);
            setTimeout(() => checkExperimentReaction(), 100);
            return;
        }

        let targetVesselId = selectedVesselId;

        // Prevent adding to collection_beaker manually (Fix for Filtration bug)
        if (targetVesselId === 'collection_beaker') {
            targetVesselId = null;
        }

        // Auto-select target if none selected (Smart UX)
        if (!targetVesselId) {
            // For Paper/Magnesium -> Tongs
            if (chemical.id === 'paper' || chemical.id === 'magnesium') {
                const tongs = Array.from(vessels.values()).find(v => v.type === 'tongs');
                if (tongs) {
                    // Check if tongs already full
                    if (tongs.contents.length > 0) {
                        // Tongs full
                    } else {
                        targetVesselId = tongs.id;
                    }
                }
            }

            // Default -> Beaker
            if (!targetVesselId) {
                // Find a suitable beaker (exclude collection_beaker for filtration)
                const availableBeakers = Array.from(vessels.values()).filter(v =>
                    v.type === 'beaker' && v.id !== 'collection_beaker'
                );
                if (availableBeakers.length > 0) {
                    targetVesselId = availableBeakers[0].id;
                }
            }
        }

        if (!targetVesselId) return;

        const targetVessel = vessels.get(targetVesselId);
        if (!targetVessel) return;

        const space = targetVessel.capacity - targetVessel.currentVolume;
        if (space <= 0) return;

        const baseVolume = chemical.id === 'muddy-water' ? 112.5 : 100; // Reduced by 10% from 125
        const volumeToAdd = Math.min(baseVolume, space);
        fillVessel(targetVesselId, chemical, volumeToAdd);

        // In guided mode, also track in experiment state and check reactions
        if (isGuidedMode) {
            addChemicalToExperiment(chemical.id);
            // Delay to allow state to update, then check reaction
            setTimeout(() => checkExperimentReaction(), 100);
        }
    };

    return (
        <div className="glass-panel p-4">
            <h3 className="text-lg font-semibold text-purple-300 mb-3">
                🧪 Laboratory Shelf
            </h3>

            {/* Hint if nothing selected, but keep UI accessible */}
            {!selectedVesselId && (
                <p className="text-xs text-yellow-500/80 mb-3 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                    💡 Click a chemical to auto-fill first available beaker
                </p>
            )}

            <div className={`transition-opacity ${!selectedVesselId ? 'opacity-90' : 'opacity-100'}`}>
                <p className="text-xs text-gray-400 mb-3">
                    Select Apparatus & Chemicals
                </p>

                {/* Apparatus Section */}
                {isGuidedMode && currentExperiment?.apparatus && (
                    <div className="mb-4">
                        <h4 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span>🧪</span> Apparatus
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {currentExperiment.apparatus.map(appId => {
                                // Disable if already placed (for unique items like funnel/paper)
                                // Beakers can be multiple? For filtration, we usually need specific startup.
                                // Let's allow multiple beakers, but disable unique props if needed.
                                const isPlaced = placedApparatus.includes(appId);
                                const isUnique = ['funnel', 'filter-paper', 'tripod-stand', 'burner', 'beaker', 'glass-rod', 'china-dish', 'tongs'].includes(appId);

                                // Order Constraints:
                                // - Beaker -> Funnel -> Filter Paper (filtration)
                                // - Glass Rod: requires beaker + (salt OR sand) added (salt-dissolution)
                                // - Tripod-stand -> Burner -> China-dish (evaporation)
                                // - Tripod-stand -> Burner -> Beaker, Beaker -> Tongs (physical-chemical)
                                const glassRodReady = placedApparatus.includes('beaker') &&
                                    (addedChemicals.includes('salt') || addedChemicals.includes('sand'));

                                // Physical-chemical experiment order constraints based on current round
                                const isPhysicalChemical = currentExperiment.id === 'physical-chemical';

                                // Round 1 (ice): need tripod, burner, beaker - tongs disabled
                                // Round 2/3 (paper/magnesium): need burner, tongs - tripod/beaker disabled
                                // User must reset after ice test for round 2/3 to activate (ice not in current session)
                                const hasIceInSession = addedChemicals.includes('ice');
                                const isRound1_Ice = isPhysicalChemical && (!iceTested || hasIceInSession);
                                const isRound2or3_PaperOrMg = isPhysicalChemical && iceTested && !hasIceInSession;

                                // Round 1: Beaker needs tripod and burner first
                                const beakerNeedsTripod = isRound1_Ice && !placedApparatus.includes('tripod-stand');
                                const beakerNeedsBurner = isRound1_Ice && !placedApparatus.includes('burner');

                                // Round 1: Tongs are disabled (not needed for ice)
                                const tongsDisabledRound1 = isRound1_Ice && appId === 'tongs';

                                // Round 2/3: Tripod and Beaker are disabled (not needed for tongs-based burning)
                                const tripodDisabledRound2 = isRound2or3_PaperOrMg && appId === 'tripod-stand';
                                const beakerDisabledRound2 = isRound2or3_PaperOrMg && appId === 'beaker';

                                // Round 2/3: Tongs needs burner first
                                const tongsNeedBurner = isRound2or3_PaperOrMg && !placedApparatus.includes('burner');

                                // Neutralization: Dropper handles itself specifically, disable generic dropper apparatus
                                // UPDATE: User wants to select dropper. So we enable it, but make it require Phenol.
                                // const dropperDisabledNeutralization = currentExperiment.id === 'neutralization' && appId === 'dropper';
                                const dropperDisabledNeutralization = currentExperiment.id === 'neutralization' && appId === 'dropper' && !addedChemicals.includes('phenolphthalein');

                                const isDisabled = (isUnique && isPlaced) ||
                                    (appId === 'funnel' && !placedApparatus.includes('beaker')) ||
                                    (appId === 'filter-paper' && !placedApparatus.includes('funnel')) ||
                                    (appId === 'glass-rod' && !glassRodReady) ||
                                    (appId === 'burner' && !isRound2or3_PaperOrMg && !placedApparatus.includes('tripod-stand')) ||
                                    (appId === 'china-dish' && !placedApparatus.includes('burner')) ||
                                    (appId === 'beaker' && (beakerNeedsTripod || beakerNeedsBurner || beakerDisabledRound2)) ||
                                    (appId === 'tongs' && (tongsDisabledRound1 || tongsNeedBurner)) ||
                                    tripodDisabledRound2 ||
                                    dropperDisabledNeutralization;

                                return (
                                    <button
                                        key={appId}
                                        onClick={() => handleAddApparatus(appId)}
                                        disabled={isDisabled}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                            ${isPlaced
                                                ? 'bg-green-800/30 border-2 border-green-500/50 text-green-300'
                                                : 'bg-blue-900/40 border-2 border-blue-400/50 text-blue-200 hover:bg-blue-800/60 hover:border-blue-400'}
                                            active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`}
                                    >
                                        <span className="text-lg">{getApparatusEmoji(appId)}</span>
                                        <span>{getApparatusLabel(appId)}</span>
                                        {isPlaced && <span className="ml-auto text-green-400">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <h4 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <span>⚗️</span> Chemicals
                </h4>
                {!placedApparatus.includes('beaker') && currentExperiment?.id !== 'evaporation' && (
                    <p className="text-xs text-yellow-400/80 mb-3 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                        ⚠️ Place a beaker first before adding chemicals
                    </p>
                )}
                {!placedApparatus.includes('china-dish') && currentExperiment?.id === 'evaporation' && (
                    <p className="text-xs text-yellow-400/80 mb-3 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                        ⚠️ Set up the heating apparatus first (Tripod → Burner → China Dish)
                    </p>
                )}
                <p className="text-xs text-gray-400 mb-3">
                    Add to selected vessel ({Math.round(remainingSpace)} ml available)
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {displayChemicals.map((chem) => {
                        // Experiment-specific apparatus requirements for chemicals
                        let apparatusReady = false;
                        if (currentExperiment?.id === 'evaporation') {
                            apparatusReady = placedApparatus.includes('china-dish');
                        } else if (currentExperiment?.id === 'physical-chemical') {
                            // Round 1 needs beaker, rounds 2/3 need tongs
                            // Round 2/3 only activates after reset (ice not in current session)
                            const hasIceInSession = addedChemicals.includes('ice');
                            const isRound2or3 = iceTested && !hasIceInSession;
                            if (!isRound2or3) {
                                apparatusReady = placedApparatus.includes('beaker');
                            } else {
                                apparatusReady = placedApparatus.includes('tongs');
                            }
                        } else {
                            apparatusReady = placedApparatus.includes('beaker');
                        }

                        const isDisabled = !apparatusReady ||
                            remainingSpace <= 0 ||
                            addedChemicals.includes(chem.id) ||
                            isChemicalDisabledForSaltDissolution(chem.id) ||
                            isChemicalDisabledForSaltDissolution(chem.id) ||
                            isChemicalDisabledForPhysicalChemical(chem.id) ||
                            isChemicalDisabledForNeutralization(chem.id) ||
                            !!dishCracked; // Disable if dish cracked

                        return (
                            <button
                                key={chem.id}
                                onClick={() => handleAddChemical(chem)}
                                disabled={isDisabled}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        hover:scale-105 active:scale-95"
                                style={{
                                    backgroundColor: `${chem.color}20`,
                                    borderColor: `${chem.color}50`,
                                    borderWidth: '1px',
                                    color: chem.color === '#ffffff' ? '#cccccc' : chem.color,
                                }}
                            >
                                <span className="text-lg">{chem.emoji}</span>
                                <span>{chem.label}</span>
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                    +100ml per click
                </p>

                {/* Actions Section - show when chemicals added OR burner placed for heating experiments */}
                {(addedChemicals.length > 0 || (needsHeating && placedApparatus.includes('burner'))) && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-sm font-bold text-orange-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span>⚡</span> Actions
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {/* Stir Action */}
                            {currentExperiment?.reactions &&
                                Object.keys(currentExperiment.reactions).some(k => k.includes('stir')) &&
                                !experimentActions.includes('stir') &&
                                (currentExperiment.id !== 'salt-dissolution' || placedApparatus.includes('glass-rod')) && (
                                    <button
                                        onClick={() => {
                                            performExperimentAction('stir');
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                            bg-orange-500/20 border border-orange-400/50 text-orange-300
                                            hover:bg-orange-500/30 active:scale-95"
                                    >
                                        <span className="text-lg">🥄</span>
                                        <span>Stir</span>
                                    </button>
                                )}

                            {/* Heat action is now automatic when burner is turned ON */}

                            {/* Filter Action */}
                            {currentExperiment?.reactions &&
                                Object.keys(currentExperiment.reactions).some(k => k.includes('filter')) &&
                                !experimentActions.includes('filter') &&
                                currentExperiment.id !== 'filtration' && (
                                    <button
                                        onClick={() => {
                                            performExperimentAction('filter');
                                            setTimeout(() => checkExperimentReaction(), 100);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                            bg-purple-500/20 border border-purple-400/50 text-purple-300
                                            hover:bg-purple-500/30 active:scale-95"
                                    >
                                        <span className="text-lg">☕</span>
                                        <span>Filter</span>
                                    </button>
                                )}

                            {/* Evaporate Action */}
                            {currentExperiment?.reactions &&
                                Object.keys(currentExperiment.reactions).some(k => k.includes('evaporate')) &&
                                !experimentActions.includes('evaporate') &&
                                currentExperiment.id !== 'evaporation' && (
                                    <button
                                        onClick={() => {
                                            performExperimentAction('evaporate');
                                            setTimeout(() => checkExperimentReaction(), 100);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                            bg-cyan-500/20 border border-cyan-400/50 text-cyan-300
                                            hover:bg-cyan-500/30 active:scale-95"
                                    >
                                        <span className="text-lg">💨</span>
                                        <span>Evaporate</span>
                                    </button>
                                )}

                            {/* Burner On/Off - only for heating experiments, hide when dish cracked */}
                            {needsHeating && placedApparatus.includes('burner') && !dishCracked && (
                                <button
                                    onClick={toggleBunsenBurner}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        ${bunsenBurnerOn
                                            ? 'bg-orange-500 text-white border border-orange-400'
                                            : 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-600/50'}`}
                                >
                                    <span className="text-lg">{bunsenBurnerOn ? '🔥' : '⚫'}</span>
                                    <span>{bunsenBurnerOn ? 'Burner ON' : 'Burner OFF'}</span>
                                </button>
                            )}
                        </div>

                        {/* Hold to Pour button - specifically for filtration */}
                        {currentExperiment?.id === 'filtration' &&
                            placedApparatus.includes('beaker') &&
                            placedApparatus.includes('funnel') &&
                            placedApparatus.includes('filter-paper') &&
                            addedChemicals.includes('muddy-water') && (
                                <button
                                    className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-bold transition-all
                                    ${isAutoPouring
                                            ? 'bg-blue-600 scale-95'
                                            : 'bg-blue-500 hover:bg-blue-400'}`}
                                    onPointerDown={() => setAutoPouring(true)}
                                    onPointerUp={() => setAutoPouring(false)}
                                    onPointerLeave={() => setAutoPouring(false)}
                                >
                                    <span className="text-xl">🫗</span>
                                    <span>Hold to Pour</span>
                                </button>
                            )}

                        {/* Reset Button - shows when reset is needed or dish cracked */}
                        {(showResetPrompt || dishCracked) && (
                            <button
                                onClick={resetExperiment}
                                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-bold transition-all
                                    bg-yellow-500 hover:bg-yellow-400 text-black"
                            >
                                <span className="text-xl">🔄</span>
                                <span>RESET</span>
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div >
    );
}
