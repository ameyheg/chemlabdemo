// Zustand store for lab state management

import { create } from 'zustand';
import type { LabVessel, VesselContents, Chemical, Reaction, ReactionEffect } from '../core/types';
import type { Experiment } from '../core/experiments';
import { getExperimentById } from '../core/experiments';
import { reactionManager } from '../core/ReactionManager';
import { SoundManager } from '../core/SoundManager';

/** Active effect for visualization */
export interface ActiveEffect {
    id: string;
    type: ReactionEffect;
    vesselId: string;
    startTime: number;
    duration: number;
}

/** Reaction notification data */
export interface ReactionNotification {
    reaction: Reaction;
    products: Chemical[];
    vesselId: string;
    timestamp: number;
}

interface LabStore {
    // State
    vessels: Map<string, LabVessel>;
    selectedVesselId: string | null;
    isPouringActive: boolean;
    pouringSourceId: string | null;
    pouringTargetId: string | null;

    // Filtration state
    pendingFiltrationVolume: number;
    isAutoPouring: boolean;

    // Phase 3: Reaction state
    activeEffects: ActiveEffect[];
    reactionNotification: ReactionNotification | null;
    safetyWarning: { title: string; message: string } | null;

    // Phase 4: Heating state
    bunsenBurnerOn: boolean;
    heatingVesselId: string | null;

    // Phase 5: Experiment/Guided Mode state
    experimentMode: 'sandbox' | 'guided';
    showLab: boolean;
    currentExperiment: Experiment | null;
    placedApparatus: string[];
    addedChemicals: string[];
    experimentActions: string[];
    currentObservation: string;
    currentExplanation: string;
    showExplanation: boolean;
    experimentHeatLevel: number;
    experimentStirCount: number;
    isStirring: boolean;
    completedExperiments: string[];
    // Salt-dissolution experiment tracking (matches 2D HTML)
    saltTested: boolean;
    sandTested: boolean;
    resetAfterSaltTest: boolean;
    showResetPrompt: boolean;
    resetPromptMessage: string;
    showCompletionPopup: boolean;  // For auto-completed experiments
    dishCracked: boolean;  // For evaporation experiment - tracks if dish broke
    // Physical-chemical experiment tracking
    iceTested: boolean;
    paperTested: boolean;
    magnesiumTested: boolean;
    // Neutralization experiment tracking
    neutralizationAnimating: boolean;
    neutralizationDropCount: number;
    neutralizationComplete: boolean;

    // Actions
    addVessel: (vessel: LabVessel) => void;
    removeVessel: (id: string) => void;
    selectVessel: (id: string | null) => void;
    fillVessel: (vesselId: string, chemical: Chemical, volume: number) => void;
    updateVesselTilt: (vesselId: string, tiltAngle: number) => void;
    updateVesselPosition: (vesselId: string, position: [number, number, number]) => void;
    clearVessel: (vesselId: string) => void;
    getVessel: (id: string) => LabVessel | undefined;
    transferLiquid: (sourceId: string, targetId: string, volume: number) => void;
    setPouringState: (isActive: boolean, sourceId?: string | null, targetId?: string | null) => void;
    addFiltrate: (volume: number) => void;
    setAutoPouring: (isActive: boolean) => void;

    // Phase 3: Reaction actions
    addEffect: (effect: Omit<ActiveEffect, 'id' | 'startTime'>) => void;
    removeEffect: (effectId: string) => void;
    clearExpiredEffects: () => void;
    dismissNotification: () => void;
    applyReaction: (vesselId: string, reaction: Reaction) => void;

    // Phase 4: Heating actions
    toggleBunsenBurner: () => void;
    setHeatingVessel: (vesselId: string | null) => void;
    updateVesselTemperature: (vesselId: string, temperature: number) => void;

    // Phase 5: Experiment/Guided Mode actions
    setExperimentMode: (mode: 'sandbox' | 'guided') => void;
    loadExperiment: (experimentId: string) => void;
    addApparatusToExperiment: (apparatusId: string) => void;
    addChemicalToExperiment: (chemicalId: string) => void;
    showSafetyWarning: (title: string, message: string) => void;
    dismissSafetyWarning: () => void;
    setDishCracked: (cracked: boolean) => void;
    performExperimentAction: (action: string) => void;
    checkExperimentReaction: () => void;
    resetExperiment: () => void;

    // Neutralization actions
    startNeutralizationAnimation: () => void;
    incrementNeutralizationDrops: () => void;
    completeNeutralization: () => void;
    resetNeutralizationState: () => void;
    markExperimentComplete: (experimentId: string) => void;
    goToHomeScreen: () => void;
}

let effectIdCounter = 0;

export const useLabStore = create<LabStore>((set, get) => ({
    // Initial state with two beakers
    vessels: new Map<string, LabVessel>([
        [
            'beaker_1',
            {
                id: 'beaker_1',
                type: 'beaker',
                capacity: 500,
                currentVolume: 0,
                tiltAngle: 0,
                temperature: 25, // Room temperature
                contents: [],
                position: [-1.2, 0, 0],
            },
        ],
        [
            'beaker_2',
            {
                id: 'beaker_2',
                type: 'beaker',
                capacity: 500,
                currentVolume: 0,
                tiltAngle: 0,
                temperature: 25,
                contents: [],
                position: [1.2, 0, 0],
            },
        ],
        // Phase 5: Test tubes
        [
            'tube_1',
            {
                id: 'tube_1',
                type: 'test_tube',
                capacity: 50,
                currentVolume: 0,
                tiltAngle: 0,
                temperature: 25,
                contents: [],
                position: [-2.5, 0, -1],
            },
        ],
        [
            'tube_2',
            {
                id: 'tube_2',
                type: 'test_tube',
                capacity: 50,
                currentVolume: 0,
                tiltAngle: 0,
                temperature: 25,
                contents: [],
                position: [-2.1, 0, -1],
            },
        ],
        [
            'tube_3',
            {
                id: 'tube_3',
                type: 'test_tube',
                capacity: 50,
                currentVolume: 0,
                tiltAngle: 0,
                temperature: 25,
                contents: [],
                position: [-1.7, 0, -1],
            },
        ],
        [
            'tube_4',
            {
                id: 'tube_4',
                type: 'test_tube',
                capacity: 50,
                currentVolume: 0,
                tiltAngle: 0,
                temperature: 25,
                contents: [],
                position: [-1.3, 0, -1],
            },
        ],
        // Conical flask
        [
            'flask_1',
            {
                id: 'flask_1',
                type: 'flask',
                capacity: 250,
                currentVolume: 0,
                tiltAngle: 0,
                temperature: 25,
                contents: [],
                position: [2.8, 0, 0.5],
            },
        ],
    ]),
    selectedVesselId: 'beaker_1',
    isPouringActive: false,
    pouringSourceId: null,
    pouringTargetId: null,
    pendingFiltrationVolume: 0,
    isAutoPouring: false,

    // Phase 3: Initial reaction state
    activeEffects: [],
    reactionNotification: null,
    safetyWarning: null,

    // Phase 4: Initial heating state
    bunsenBurnerOn: false,
    heatingVesselId: null,

    // Phase 5: Initial experiment/guided mode state
    experimentMode: 'sandbox',
    showLab: false,
    currentExperiment: null,
    placedApparatus: [],
    addedChemicals: [],
    experimentActions: [],
    currentObservation: 'Welcome to the Virtual Chemistry Lab! Select an experiment to begin.',
    currentExplanation: '',
    showExplanation: false,
    experimentHeatLevel: 0,
    experimentStirCount: 0,
    isStirring: false,
    completedExperiments: JSON.parse(localStorage.getItem('completedExperiments') || '[]'),
    // Salt-dissolution experiment tracking (matches 2D HTML implementation)
    saltTested: false,
    sandTested: false,
    resetAfterSaltTest: false,
    showResetPrompt: false,
    resetPromptMessage: '',
    showCompletionPopup: false,
    dishCracked: false,
    // Physical-chemical experiment tracking (matches 2D HTML implementation)
    iceTested: false,
    paperTested: false,
    magnesiumTested: false,
    neutralizationAnimating: false,
    neutralizationDropCount: 0,
    neutralizationComplete: false,

    // Add a new vessel
    addVessel: (vessel) =>
        set((state) => {
            const newVessels = new Map(state.vessels);
            newVessels.set(vessel.id, vessel);

            let newPlacedApparatus = state.placedApparatus;

            // Filtration Experiment logic:
            // When user places a beaker, automatically place the collection beaker and track it
            if (state.currentExperiment?.id === 'filtration' && vessel.type === 'beaker') {
                // Set name for the source beaker
                const sourceVessel = newVessels.get(vessel.id);
                if (sourceVessel && !sourceVessel.name) {
                    newVessels.set(vessel.id, { ...sourceVessel, name: 'Muddy Water Beaker' });
                }

                if (!newVessels.has('collection_beaker')) {
                    newVessels.set('collection_beaker', {
                        id: 'collection_beaker',
                        name: 'Collection Beaker',
                        type: 'beaker',
                        capacity: 250,
                        currentVolume: 0,
                        tiltAngle: 0,
                        temperature: 25,
                        contents: [],
                        position: [3.5, 0, 0] // Positioned under the Filter Funnel
                    });
                }
                if (!newPlacedApparatus.includes('beaker')) {
                    newPlacedApparatus = [...newPlacedApparatus, 'beaker'];
                }
            }

            return { vessels: newVessels, placedApparatus: newPlacedApparatus };
        }),

    // Remove a vessel
    removeVessel: (id) =>
        set((state) => {
            const newVessels = new Map(state.vessels);
            newVessels.delete(id);
            return { vessels: newVessels };
        }),

    // Select a vessel
    selectVessel: (id) => set({ selectedVesselId: id }),

    // Fill a vessel with a chemical
    fillVessel: (vesselId, chemical, volume) =>
        set((state) => {
            const vessel = state.vessels.get(vesselId);
            if (!vessel) return state;

            const newVolume = Math.min(vessel.currentVolume + volume, vessel.capacity);
            const actualVolumeAdded = newVolume - vessel.currentVolume;

            if (actualVolumeAdded <= 0) return state;

            const existingContentIndex = vessel.contents.findIndex(
                (c) => c.chemical.id === chemical.id
            );

            let newContents: VesselContents[];
            if (existingContentIndex >= 0) {
                newContents = vessel.contents.map((c, i) =>
                    i === existingContentIndex
                        ? { ...c, volume: c.volume + actualVolumeAdded }
                        : c
                );
            } else {
                newContents = [...vessel.contents, { chemical, volume: actualVolumeAdded }];
            }

            const newVessels = new Map(state.vessels);
            newVessels.set(vesselId, {
                ...vessel,
                currentVolume: newVolume,
                contents: newContents,
            });

            // Check for reactions after filling
            const updatedVessel = newVessels.get(vesselId)!;
            const reactionResult = reactionManager.checkReaction(updatedVessel.contents);

            if (reactionResult.occurred && reactionResult.reaction) {
                // Trigger reaction application after state update
                setTimeout(() => {
                    get().applyReaction(vesselId, reactionResult.reaction!);
                }, 100);
            }

            return { vessels: newVessels };
        }),

    // Update vessel tilt angle
    updateVesselTilt: (vesselId, tiltAngle) =>
        set((state) => {
            const vessel = state.vessels.get(vesselId);
            if (!vessel) return state;

            const newVessels = new Map(state.vessels);
            newVessels.set(vesselId, { ...vessel, tiltAngle });
            return { vessels: newVessels };
        }),

    // Update vessel position
    updateVesselPosition: (vesselId, position) =>
        set((state) => {
            const vessel = state.vessels.get(vesselId);
            if (!vessel) return state;

            const newVessels = new Map(state.vessels);
            newVessels.set(vesselId, { ...vessel, position });
            return { vessels: newVessels };
        }),

    // Clear vessel contents
    clearVessel: (vesselId) =>
        set((state) => {
            const vessel = state.vessels.get(vesselId);
            if (!vessel) return state;

            const newVessels = new Map(state.vessels);
            newVessels.set(vesselId, {
                ...vessel,
                currentVolume: 0,
                contents: [],
                tiltAngle: 0,
            });
            return { vessels: newVessels };
        }),

    // Get a vessel by ID
    getVessel: (id) => get().vessels.get(id),

    // Transfer liquid from source to target vessel
    transferLiquid: (sourceId, targetId, volume) =>
        set((state) => {
            const source = state.vessels.get(sourceId);
            const target = state.vessels.get(targetId);

            if (!source || !target) return state;
            if (source.currentVolume <= 0) return state;

            // Calculate actual transfer amount
            const availableVolume = source.currentVolume;
            const targetSpace = target.capacity - target.currentVolume;
            const actualTransfer = Math.min(volume, availableVolume, targetSpace);

            if (actualTransfer <= 0) return state;

            // Calculate ratio for proportional transfer of contents
            const transferRatio = actualTransfer / source.currentVolume;

            // Transfer contents proportionally
            const newSourceContents: VesselContents[] = [];
            const transferredContents: VesselContents[] = [];

            source.contents.forEach((content) => {
                const transferAmount = content.volume * transferRatio;
                const remainingAmount = content.volume - transferAmount;

                if (remainingAmount > 0.01) {
                    newSourceContents.push({ ...content, volume: remainingAmount });
                }
                if (transferAmount > 0.01) {
                    transferredContents.push({ chemical: content.chemical, volume: transferAmount });
                }
            });

            // Merge transferred contents into target
            let newTargetContents = [...target.contents];
            transferredContents.forEach((transferred) => {
                const existingIndex = newTargetContents.findIndex(
                    (c) => c.chemical.id === transferred.chemical.id
                );
                if (existingIndex >= 0) {
                    newTargetContents[existingIndex] = {
                        ...newTargetContents[existingIndex],
                        volume: newTargetContents[existingIndex].volume + transferred.volume,
                    };
                } else {
                    newTargetContents.push(transferred);
                }
            });

            const newVessels = new Map(state.vessels);
            newVessels.set(sourceId, {
                ...source,
                currentVolume: source.currentVolume - actualTransfer,
                contents: newSourceContents,
            });
            newVessels.set(targetId, {
                ...target,
                currentVolume: target.currentVolume + actualTransfer,
                contents: newTargetContents,
            });

            // Check for reactions in the target vessel after transfer
            const updatedTarget = newVessels.get(targetId)!;
            const reactionResult = reactionManager.checkReaction(updatedTarget.contents);

            if (reactionResult.occurred && reactionResult.reaction) {
                // Trigger reaction application after state update
                setTimeout(() => {
                    get().applyReaction(targetId, reactionResult.reaction!);
                }, 100);
            }

            // Filtration Logic: Detect Pour into Collection Beaker
            // Always divert this to the funnel (pending buffer) as collection_beaker
            // should only receive filtrate, never direct pours.
            let pendingVolume = state.pendingFiltrationVolume || 0;
            let newExperimentActions = state.experimentActions;

            if (targetId === 'collection_beaker') {
                if (actualTransfer > 0 && !newExperimentActions.includes('pour')) {
                    newExperimentActions = [...newExperimentActions, 'pour'];
                }
                // Divert liquid to pending buffer (Funnel)
                pendingVolume += actualTransfer;

                // Reset collection beaker (prevent brown liquid from filling it)
                const originalTarget = state.vessels.get(targetId);
                if (originalTarget) {
                    // Keep it empty (or previous state)
                    newVessels.set(targetId, originalTarget);
                }
            }

            return { vessels: newVessels, experimentActions: newExperimentActions, pendingFiltrationVolume: pendingVolume };
        }),

    // Set pouring state
    setPouringState: (isActive, sourceId = null, targetId = null) =>
        set({
            isPouringActive: isActive,
            pouringSourceId: sourceId,
            pouringTargetId: targetId,
        }),

    addFiltrate: (volume) =>
        set((state) => {
            const beaker = state.vessels.get('collection_beaker');
            if (!beaker || state.pendingFiltrationVolume <= 0) return {};

            const finalVolume = Math.min(volume, state.pendingFiltrationVolume);
            if (finalVolume <= 0) return {};

            const clearWater = { id: 'water', name: 'Water', color: '#c8e0ff', type: 'water' as const };

            const newVessels = new Map(state.vessels);
            const currentContent = beaker.contents.find(c => c.chemical.id === 'water');

            let newContents: VesselContents[] = [...beaker.contents];
            if (currentContent) {
                newContents = beaker.contents.map(c => c.chemical.id === 'water' ? { ...c, volume: c.volume + finalVolume } : c);
            } else {
                newContents.push({ chemical: clearWater, volume: finalVolume });
            }

            newVessels.set('collection_beaker', {
                ...beaker,
                currentVolume: beaker.currentVolume + finalVolume,
                contents: newContents
            });

            return {
                vessels: newVessels,
                pendingFiltrationVolume: state.pendingFiltrationVolume - finalVolume
            };
        }),

    setAutoPouring: (isActive) => set({ isAutoPouring: isActive }),

    // Phase 3: Add visual effect
    addEffect: (effect) =>
        set((state) => ({
            activeEffects: [
                ...state.activeEffects,
                {
                    ...effect,
                    id: `effect_${++effectIdCounter}`,
                    startTime: Date.now(),
                },
            ],
        })),

    // Phase 3: Remove visual effect
    removeEffect: (effectId) =>
        set((state) => ({
            activeEffects: state.activeEffects.filter((e) => e.id !== effectId),
        })),

    // Phase 3: Clear expired effects
    clearExpiredEffects: () =>
        set((state) => {
            const now = Date.now();
            return {
                activeEffects: state.activeEffects.filter(
                    (e) => now - e.startTime < e.duration
                ),
            };
        }),

    // Phase 3: Dismiss notification
    dismissNotification: () => set({ reactionNotification: null }),

    showSafetyWarning: (title, message) => set({ safetyWarning: { title, message } }),
    dismissSafetyWarning: () => set({ safetyWarning: null }),
    setDishCracked: (cracked) => set({ dishCracked: cracked }),

    resetPhysicalChemicalState: () => {
        set({
            iceTested: false,
            paperTested: false,
            magnesiumTested: false,
            showResetPrompt: false,
            resetPromptMessage: '',
            placedApparatus: [], // Clear all apparatus
            addedChemicals: [],  // Clear all chemicals
            experimentActions: [], // Clear actions
            currentObservation: '',
            currentExplanation: '',
            showExplanation: false,
            vessels: new Map(), // Clear vessels
            activeEffects: []   // Clear effects
        });
    },

    // Neutralization actions
    startNeutralizationAnimation: () => {
        set({
            neutralizationAnimating: true,
            neutralizationDropCount: 0,
            showResetPrompt: false
        });
    },

    incrementNeutralizationDrops: () => {
        const { neutralizationDropCount } = get();
        const newCount = neutralizationDropCount + 1;
        set({ neutralizationDropCount: newCount });

        // Check if complete (after 5 drops)
        if (newCount >= 5) {
            get().completeNeutralization();
        }
    },

    completeNeutralization: () => {
        set({
            neutralizationAnimating: false,
            neutralizationComplete: true,
            // Add HCl to chemicals if not already there to complete the reaction logic
            addedChemicals: [...get().addedChemicals.filter(c => c !== 'hcl'), 'hcl']
        });
        // Trigger reaction check
        get().checkExperimentReaction();
    },

    resetNeutralizationState: () => {
        set({
            neutralizationAnimating: false,
            neutralizationDropCount: 0,
            neutralizationComplete: false
        });
    },

    // Phase 3: Apply reaction results
    applyReaction: (vesselId, reaction) =>
        set((state) => {
            const vessel = state.vessels.get(vesselId);
            if (!vessel) return state;

            // Create new contents with reaction products
            const newContents: VesselContents[] = reaction.products.map((product) => ({
                chemical: product,
                volume: vessel.currentVolume / reaction.products.length,
            }));

            const newVessels = new Map(state.vessels);
            newVessels.set(vesselId, {
                ...vessel,
                contents: newContents,
            });

            // Add visual effects for the reaction
            const newEffects: ActiveEffect[] = reaction.effects.map((effectType) => {
                const duration = effectType === 'bubbles' ? 4000 : 3000;
                const effectId = `effect_${++effectIdCounter}`;

                // Play sound for each effect
                SoundManager.playReactionSound(effectType, effectId, duration);

                return {
                    id: effectId,
                    type: effectType,
                    vesselId,
                    startTime: Date.now(),
                    duration,
                };
            });

            // Create notification
            const notification: ReactionNotification = {
                reaction,
                products: reaction.products,
                vesselId,
                timestamp: Date.now(),
            };

            return {
                vessels: newVessels,
                activeEffects: [...state.activeEffects, ...newEffects],
                reactionNotification: notification,
            };
        }),

    // Phase 4: Toggle Bunsen burner on/off
    toggleBunsenBurner: () =>
        set((state) => {
            const newState = !state.bunsenBurnerOn;
            let newActions = state.experimentActions;

            if (newState) {
                SoundManager.playFlame('bunsen_burner');
                // Track 'heat' action for step completion
                if (!newActions.includes('heat')) {
                    newActions = [...newActions, 'heat'];
                }
            } else {
                SoundManager.stopSound('bunsen_burner');
            }
            return {
                bunsenBurnerOn: newState,
                experimentActions: newActions
            };
        }),

    // Phase 4: Set which vessel is being heated
    setHeatingVessel: (vesselId) =>
        set({ heatingVesselId: vesselId }),

    // Phase 4: Update vessel temperature
    updateVesselTemperature: (vesselId, temperature) =>
        set((state) => {
            const vessel = state.vessels.get(vesselId);
            if (!vessel) return state;

            const newVessels = new Map(state.vessels);
            newVessels.set(vesselId, { ...vessel, temperature });
            return { vessels: newVessels };
        }),

    // Phase 5: Set experiment mode (sandbox or guided)
    setExperimentMode: (mode) =>
        set({ experimentMode: mode, showLab: true }),

    // Phase 5: Load an experiment by ID
    loadExperiment: (experimentId) =>
        set(() => {
            const experiment = getExperimentById(experimentId);
            if (!experiment) return {};

            // Start with empty lab bench - user must place all apparatus manually
            const guidedVessels = new Map<string, LabVessel>();

            return {
                experimentMode: 'guided',
                showLab: true,
                currentExperiment: experiment,
                vessels: guidedVessels,
                selectedVesselId: 'beaker_1',
                placedApparatus: [],
                addedChemicals: [],
                experimentActions: [],
                currentObservation: `📋 ${experiment.aim}`,
                currentExplanation: '',
                showExplanation: false,
                experimentHeatLevel: 0,
                experimentStirCount: 0,
            };
        }),

    // Phase 5: Add apparatus to experiment
    addApparatusToExperiment: (apparatusId) =>
        set((state) => {
            if (state.placedApparatus.includes(apparatusId)) return state;

            const newPlacedApparatus = [...state.placedApparatus, apparatusId];
            return {
                placedApparatus: newPlacedApparatus,
                currentObservation: `Added ${apparatusId.replace(/-/g, ' ')} to the lab bench.`,
            };
        }),

    // Phase 5: Add chemical to experiment
    addChemicalToExperiment: (chemicalId) =>
        set((state) => {
            if (state.addedChemicals.includes(chemicalId)) return state;

            const newAddedChemicals = [...state.addedChemicals, chemicalId];

            // Find chemical name from experiment
            const chemical = state.currentExperiment?.chemicals.find(c => c.id === chemicalId);
            const chemicalName = chemical?.name || chemicalId.replace(/-/g, ' ');

            return {
                addedChemicals: newAddedChemicals,
                currentObservation: `Added ${chemicalName} to the apparatus.`,
            };
        }),

    // Phase 5: Perform an action (stir, pour, filter, evaporate, heat)
    performExperimentAction: (action) =>
        set((state) => {
            if (state.experimentActions.includes(action)) return state;

            const newActions = [...state.experimentActions, action];

            // Update heat level for heat action
            let newHeatLevel = state.experimentHeatLevel;
            let newStirCount = state.experimentStirCount;
            let stirring = state.isStirring;

            if (action === 'heat') {
                newHeatLevel = Math.min(100, state.experimentHeatLevel + 30);

                // Auto-trigger evaporation for Separation by Evaporation
                if (state.currentExperiment?.id === 'evaporation') {
                    // Use setTimeout to simulate time passing for evaporation
                    setTimeout(() => {
                        useLabStore.getState().performExperimentAction('evaporate');
                        useLabStore.getState().checkExperimentReaction();
                    }, 5000);
                }
            } else if (action === 'stir') {
                newStirCount = state.experimentStirCount + 1;
                stirring = true;
                // Stir for 4 seconds, then check reaction when complete
                setTimeout(() => {
                    useLabStore.setState({ isStirring: false });
                    // Check reaction after stirring completes
                    useLabStore.getState().checkExperimentReaction();
                }, 4000);
            }


            return {
                experimentActions: newActions,
                experimentHeatLevel: newHeatLevel,
                experimentStirCount: newStirCount,
                isStirring: stirring,
            };
        }),

    // Phase 5: Check current state against experiment reactions
    checkExperimentReaction: () =>
        set((state) => {
            if (!state.currentExperiment) return state;

            // Build possible reaction keys from current state
            const chemicals = [...state.addedChemicals];
            const actions = [...state.experimentActions];

            // Generate possible key combinations - MOST SPECIFIC FIRST
            const generateKeys = (): string[] => {
                const keys: string[] = [];

                // FIRST: Try chemicals + all actions (most specific)
                if (actions.length > 0) {
                    keys.push([...chemicals, ...actions].join('+'));
                    keys.push([...chemicals].sort().concat([...actions].sort()).join('+'));
                }

                // SECOND: Try chemicals + each individual action
                for (const action of actions) {
                    keys.push([...chemicals, action].join('+'));
                    keys.push([...chemicals].sort().concat(action).join('+'));
                }

                // LAST: Try chemicals only (least specific)
                if (chemicals.length > 0) {
                    keys.push(chemicals.join('+'));
                    keys.push([...chemicals].sort().join('+'));
                }

                return keys;
            };

            const possibleKeys = generateKeys();
            const definedReactionKeys = Object.keys(state.currentExperiment.reactions);

            let matchedReaction = null;
            let matchedKey = '';

            // First try exact matches from our generated keys
            for (const key of possibleKeys) {
                if (state.currentExperiment.reactions[key]) {
                    matchedReaction = state.currentExperiment.reactions[key];
                    matchedKey = key;
                    break;
                }
            }

            // If no match, try checking if any defined reaction key matches our state
            if (!matchedReaction) {
                for (const definedKey of definedReactionKeys) {
                    const parts = definedKey.split('+');
                    const requiredChemicals = parts.filter(p => !['stir', 'heat', 'filter', 'evaporate', 'pour'].includes(p));
                    const requiredActions = parts.filter(p => ['stir', 'heat', 'filter', 'evaporate', 'pour'].includes(p));

                    const hasAllChemicals = requiredChemicals.every(c => chemicals.includes(c));
                    const hasAllActions = requiredActions.every(a => actions.includes(a));

                    if (hasAllChemicals && hasAllActions) {
                        matchedReaction = state.currentExperiment.reactions[definedKey];
                        matchedKey = definedKey;
                        break;
                    }
                }
            }

            if (matchedReaction) {
                // Handle multi-phase experiment (salt-dissolution) - matches 2D HTML logic
                if (state.currentExperiment.id === 'salt-dissolution' && matchedReaction.success) {
                    let newSaltTested = state.saltTested;
                    let newSandTested = state.sandTested;
                    let showResetPrompt = false;
                    let resetPromptMessage = '';

                    // Check which phase was completed
                    if (matchedKey.includes('salt') && matchedKey.includes('stir') && !state.saltTested) {
                        newSaltTested = true;
                        showResetPrompt = true;
                        resetPromptMessage = '✅ Salt test complete! Click RESET to test with Sand.';
                    } else if (matchedKey.includes('sand') && matchedKey.includes('stir') && !state.sandTested) {
                        newSandTested = true;
                    }

                    // Check if both phases completed
                    if (newSaltTested && newSandTested) {
                        showResetPrompt = false;

                        // Auto-mark as complete
                        const experimentId = state.currentExperiment.id;
                        if (!state.completedExperiments.includes(experimentId)) {
                            const newCompleted = [...state.completedExperiments, experimentId];
                            localStorage.setItem('completedExperiments', JSON.stringify(newCompleted));

                            // Delay completion popup by 3 seconds so user can observe sand settling
                            setTimeout(() => {
                                useLabStore.setState({ showCompletionPopup: true });
                            }, 3000);

                            return {
                                currentObservation: '🎉 Experiment Complete! You tested both salt and sand.',
                                currentExplanation: state.currentExperiment.conclusion,
                                showExplanation: true,
                                saltTested: newSaltTested,
                                sandTested: newSandTested,
                                showResetPrompt: false,
                                resetPromptMessage: '',
                                completedExperiments: newCompleted,
                                // Don't show popup immediately - delay handled above
                            };
                        }
                    }

                    return {
                        currentObservation: matchedReaction.observation,
                        currentExplanation: matchedReaction.explanation,
                        showExplanation: true,
                        saltTested: newSaltTested,
                        sandTested: newSandTested,
                        showResetPrompt,
                        resetPromptMessage,
                    };
                }

                // Handle Physical vs Chemical Changes (Exp 4)
                else if (state.currentExperiment.id === 'physical-chemical') {
                    let showResetPrompt = false;
                    let resetPromptMessage = '';
                    const newVessels = new Map(state.vessels);

                    // 1. Ice + Heat (Melting)
                    if (matchedKey === 'ice+heat') {
                        showResetPrompt = true;
                        resetPromptMessage = '✅ Ice melted! Click RESET to test with Paper.';

                        // Melt ice -> Replace with Water in beaker
                        // Find beaker with ice
                        for (const [id, vessel] of newVessels.entries()) {
                            const iceContent = vessel.contents.find(c => c.chemical.id === 'ice');
                            if (iceContent) {
                                // Replace ice with water - use full ice volume
                                // The visual melt animation already showed the transition
                                const expWater = state.currentExperiment.chemicals.find(c => c.id === 'water');
                                const waterChem = {
                                    id: 'water',
                                    name: 'Water',
                                    color: '#a8d4ff',
                                    type: 'water' as const,
                                    ...expWater
                                };

                                // Use 40% of ice volume to match visual ice cube size
                                const visualIceRatio = 0.4;
                                const waterVolume = iceContent.volume * visualIceRatio;
                                const newContents = [{ chemical: waterChem as any, volume: waterVolume }];
                                newVessels.set(id, { ...vessel, contents: newContents, currentVolume: waterVolume });
                            }
                        }

                        return {
                            vessels: newVessels,
                            currentObservation: matchedReaction.observation,
                            currentExplanation: matchedReaction.explanation,
                            showExplanation: true,
                            showResetPrompt,
                            resetPromptMessage,
                            iceTested: true, // Mark ice as tested
                        };
                    }
                    // 2. Paper + Heat (Burning)
                    else if (matchedKey === 'paper+heat') {
                        showResetPrompt = true;
                        resetPromptMessage = '✅ Paper burnt! Click RESET to test with Magnesium.';

                        // Burn paper -> Ash
                        for (const [id, vessel] of newVessels.entries()) {
                            if (vessel.type === 'tongs' && vessel.contents.some(c => c.chemical.id === 'paper')) {
                                const ashChem = { id: 'ash', name: 'Ash', color: '#333', type: 'neutral' as const };
                                const newContents = [{ chemical: ashChem as any, volume: 1 }];
                                newVessels.set(id, { ...vessel, contents: newContents });
                            }
                        }

                        return {
                            vessels: newVessels,
                            currentObservation: matchedReaction.observation,
                            currentExplanation: matchedReaction.explanation,
                            showExplanation: true,
                            showResetPrompt,
                            resetPromptMessage,
                            paperTested: true, // Mark paper as tested
                            bunsenBurnerOn: false, // Auto-off after paper burns
                        };
                    }
                    // 3. Magnesium + Heat (Burning)
                    else if (matchedKey === 'magnesium+heat') {
                        // Final step - no reset prompt, finish experiment

                        // Burn Mg -> Ash/Oxide
                        for (const [id, vessel] of newVessels.entries()) {
                            if (vessel.type === 'tongs' && vessel.contents.some(c => c.chemical.id === 'magnesium')) {
                                const ashChem = { id: 'magnesium-oxide', name: 'Magnesium Oxide', color: '#fff', type: 'base' as const };
                                const newContents = [{ chemical: ashChem as any, volume: 1 }];
                                newVessels.set(id, { ...vessel, contents: newContents });
                            }
                        }

                        // Mark complete - all three materials tested
                        if (!state.completedExperiments.includes(state.currentExperiment.id)) {
                            const newCompleted = [...state.completedExperiments, state.currentExperiment.id];
                            localStorage.setItem('completedExperiments', JSON.stringify(newCompleted));
                            setTimeout(() => {
                                useLabStore.setState({ showCompletionPopup: true });
                            }, 3000);
                            return {
                                vessels: newVessels,
                                currentObservation: matchedReaction.observation,
                                currentExplanation: matchedReaction.explanation,
                                showExplanation: true,
                                completedExperiments: newCompleted,
                                magnesiumTested: true, // Mark magnesium as tested
                                bunsenBurnerOn: false, // Auto-off after magnesium burns
                            };
                        }

                        return {
                            vessels: newVessels,
                            currentObservation: matchedReaction.observation,
                            currentExplanation: matchedReaction.explanation,
                            showExplanation: true,
                            magnesiumTested: true, // Mark magnesium as tested
                            bunsenBurnerOn: false, // Auto-off after magnesium burns
                        };
                    }

                    return {
                        vessels: newVessels,
                        currentObservation: matchedReaction.observation,
                        currentExplanation: matchedReaction.explanation,
                        showExplanation: true,
                        showResetPrompt,
                        resetPromptMessage
                    };
                }

                // Generic Success Handling (e.g. Filtration)
                else if (matchedReaction.success && !state.completedExperiments.includes(state.currentExperiment.id)) {
                    const experimentId = state.currentExperiment.id;
                    const newCompleted = [...state.completedExperiments, experimentId];
                    localStorage.setItem('completedExperiments', JSON.stringify(newCompleted));

                    // Delay completion popup by 3 seconds so user can observe results
                    setTimeout(() => {
                        useLabStore.setState({ showCompletionPopup: true });
                    }, 3000);

                    return {
                        currentObservation: matchedReaction.observation || 'Experiment Complete!',
                        currentExplanation: matchedReaction.explanation || state.currentExperiment.conclusion,
                        showExplanation: true,
                        completedExperiments: newCompleted,
                        // Don't show popup immediately - delay handled above
                    };
                }

                // Default behavior for other experiments
                return {
                    currentObservation: matchedReaction.observation,
                    currentExplanation: matchedReaction.explanation,
                    showExplanation: matchedReaction.success || (!!matchedReaction.explanation && matchedReaction.explanation.length > 0),
                };
            }
            return state;
        }),

    // Phase 5: Reset current experiment (preserves salt/sand test state for multi-step)
    resetExperiment: () =>
        set((state) => {
            if (!state.currentExperiment) return state;

            // Clear all vessels - user must place beaker again

            // For salt-dissolution: track if resetting after salt test
            let newResetAfterSaltTest = state.resetAfterSaltTest;
            let observation = `📋 ${state.currentExperiment.aim}`;
            let previousSteps: string[] = [];

            // Checks for salt-dissolution specific reset logic
            if (state.currentExperiment.id === 'salt-dissolution') {
                if (state.saltTested && !state.sandTested) {
                    newResetAfterSaltTest = true;
                    previousSteps = ['Add water to the beaker', 'Add salt to the water', 'Stir the mixture', 'Observe: Salt disappears'];
                    observation = '👉 Now test with SAND. Add water, then add sand, and stir.';
                } else if (state.saltTested && state.sandTested) {
                    // Full reset if both parts completed
                    // This allows the user to re-run the full experiment
                    newResetAfterSaltTest = false;
                    // We need to return these reset values in the state update below
                }
            }

            // Physical-chemical experiment reset logic
            let newIceTested = state.iceTested;
            let newPaperTested = state.paperTested;
            let newMagnesiumTested = state.magnesiumTested;

            if (state.currentExperiment.id === 'physical-chemical') {
                if (state.iceTested && !state.paperTested) {
                    // After ice test, guide to paper
                    observation = '👉 Round 2: Now test with PAPER. Place burner and tongs, then add paper strip and heat.';
                } else if (state.iceTested && state.paperTested && !state.magnesiumTested) {
                    // After paper test, guide to magnesium
                    observation = '👉 Round 3: Now test with MAGNESIUM. Place burner and tongs, then add magnesium ribbon and heat.';
                } else if (state.iceTested && state.paperTested && state.magnesiumTested) {
                    // Full reset if all parts completed
                    newIceTested = false;
                    newPaperTested = false;
                    newMagnesiumTested = false;
                    observation = `📋 ${state.currentExperiment.aim}`;
                }
            }

            return {
                ...state,
                currentExperiment: {
                    ...state.currentExperiment,
                    // Reset steps but keep previous if mid-experiment
                    procedureSteps: previousSteps.length > 0 ? previousSteps : state.currentExperiment.procedureSteps
                },
                vessels: new Map(), // Clear all vessels
                placedApparatus: [], // Clear all apparatus
                addedChemicals: [], // Clear chemicals
                experimentActions: [], // Clear actions
                experimentRunning: false, // Stop running
                timer: 0, // Reset timer
                currentObservation: observation,
                currentExplanation: '',
                showExplanation: false,
                experimentHeatLevel: 0,
                experimentStirCount: 0,
                isStirring: false,
                resetAfterSaltTest: newResetAfterSaltTest,

                // Explicitly update tracking flags
                // If both were true, we reset them (undefined/false in return means reset if we don't grab from state? No, we must be explicit)
                saltTested: (state.saltTested && state.sandTested) ? false : state.saltTested,
                sandTested: (state.saltTested && state.sandTested) ? false : state.sandTested,

                // Physical-chemical experiment tracking
                iceTested: newIceTested,
                paperTested: newPaperTested,
                magnesiumTested: newMagnesiumTested,

                showResetPrompt: false, // Clear prompt
                resetPromptMessage: '',
                showCompletionPopup: false,
                dishCracked: false,
                safetyWarning: null,
                bunsenBurnerOn: false, // Turn off burner on reset
            };
        }),

    // Phase 5: Mark experiment as complete
    markExperimentComplete: (experimentId) =>
        set((state) => {
            if (state.completedExperiments.includes(experimentId)) return state;

            const newCompleted = [...state.completedExperiments, experimentId];
            localStorage.setItem('completedExperiments', JSON.stringify(newCompleted));

            return { completedExperiments: newCompleted };
        }),

    // Phase 5: Go back to home screen
    goToHomeScreen: () =>
        set({
            experimentMode: 'sandbox',
            showLab: false,
            currentExperiment: null,
            placedApparatus: [],
            addedChemicals: [],
            experimentActions: [],
            currentObservation: 'Welcome to the Virtual Chemistry Lab! Select an experiment to begin.',
            currentExplanation: '',
            showExplanation: false,
            experimentHeatLevel: 0,
            experimentStirCount: 0,
        }),
}));
