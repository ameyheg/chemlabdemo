
import { useLabStore } from '../store/labStore';

export function MobileStepIndicator() {
    const currentExperiment = useLabStore((state) => state.currentExperiment);
    const placedApparatus = useLabStore((state) => state.placedApparatus);
    const addedChemicals = useLabStore((state) => state.addedChemicals);
    const experimentActions = useLabStore((state) => state.experimentActions);
    const bunsenBurnerOn = useLabStore((state) => state.bunsenBurnerOn);

    // Salt-dissolution phase tracking
    const saltTested = useLabStore((state) => state.saltTested);
    const resetAfterSaltTest = useLabStore((state) => state.resetAfterSaltTest);

    // Neutralization tracking
    const neutralizationDropCount = useLabStore((state) => state.neutralizationDropCount);
    const neutralizationComplete = useLabStore((state) => state.neutralizationComplete);

    if (!currentExperiment) return null;

    // Logic replicated from ObservationPanel.tsx
    let procedureSteps = currentExperiment.procedureSteps || [];

    // For salt-dissolution: show sand instructions after salt tested + reset
    if (currentExperiment.id === 'salt-dissolution' && saltTested && resetAfterSaltTest) {
        procedureSteps = [
            'Place the beaker on the lab bench',
            'Add water to the beaker',
            'Add sand to the water',
            'Place the glass rod',
            'Stir the mixture with glass rod',
            'Observe what happens to the sand',
        ];
    }

    // Physical-Chemical phase tracking
    const iceTested = useLabStore((state) => state.iceTested);
    const paperTested = useLabStore((state) => state.paperTested);
    const showResetPrompt = useLabStore((state) => state.showResetPrompt);

    // Calculate base actions count (apparatus + chemicals + actions)
    let currentPhaseActions = placedApparatus.length + addedChemicals.length + experimentActions.length;

    // For Physical-Chemical (Exp 4), we need to add offsets based on completed phases
    // Phase 1 (Ice) = Steps 1-6 (6 steps)
    // Phase 2 (Paper) = Steps 7-11 (5 steps)
    // Phase 3 (Magnesium) = Steps 12-15 (4 steps)

    let stepOffset = 0;
    if (currentExperiment.id === 'physical-chemical') {
        // Use showResetPrompt to distinguish between "Cleanup Phase" and "Next Phase Execution"

        if (paperTested) {
            // If Paper tested:
            // - showing prompt? -> In Phase 2 Cleanup -> Offset 6
            // - not showing? -> In Phase 3 -> Offset 11
            stepOffset = showResetPrompt ? 6 : 11;
        } else if (iceTested) {
            // If Ice tested:
            // - showing prompt? -> In Phase 1 Cleanup -> Offset 0
            // - not showing? -> In Phase 2 -> Offset 6
            stepOffset = showResetPrompt ? 0 : 6;
        }
    }

    let completedStepsCount = Math.min(
        stepOffset + currentPhaseActions,
        procedureSteps.length
    );

    // Custom progress tracking for Neutralization
    if (currentExperiment.id === 'neutralization') {
        let count = 0;
        // Step 1: Place beaker
        if (placedApparatus.includes('beaker')) count = 1;
        // Step 2: Add NaOH
        if (count === 1 && addedChemicals.includes('naoh')) count = 2;
        // Step 3: Add Phenolphthalein
        if (count === 2 && addedChemicals.includes('phenolphthalein')) count = 3;
        // Step 4: Select Dropper
        if (count === 3 && placedApparatus.includes('dropper')) count = 4;
        // Step 5: Add 5 drops of HCl
        if (count === 4 && (neutralizationDropCount >= 5 || neutralizationComplete)) count = 5;

        completedStepsCount = count;
    }

    const isAllComplete = completedStepsCount >= procedureSteps.length;
    const currentStepText = isAllComplete
        ? "✅ Experiment interactions complete! Check observations."
        : procedureSteps[completedStepsCount];

    // Refined error check for store based:
    // If burner is on but salt solution not added, user skipped step.
    const showMissedSaltError = currentExperiment.id === 'evaporation' && bunsenBurnerOn && !addedChemicals.includes('salt-solution');

    return (
        <div className={`absolute top-0 left-0 right-0 z-30 px-3 py-2 border-b backdrop-blur-md transition-colors duration-300
            ${showMissedSaltError
                ? 'bg-red-500/90 border-red-400 text-white animate-pulse'
                : 'bg-slate-900/80 border-cyan-500/30 text-cyan-100'
            }`}
        >
            <div className="flex items-start gap-2 max-w-lg mx-auto">
                <span className="text-lg mt-0.5">
                    {showMissedSaltError ? '⚠️' : isAllComplete ? '🎉' : '👉'}
                </span>
                <div className="flex-1">
                    {showMissedSaltError ? (
                        <p className="font-bold text-sm leading-tight">
                            Wait! You missed adding the Salt Solution!
                        </p>
                    ) : (
                        <p className={`text-sm font-medium leading-tight ${isAllComplete ? 'text-green-300' : 'text-cyan-200'}`}>
                            {currentStepText}
                        </p>
                    )}

                    {!isAllComplete && !showMissedSaltError && (
                        <p className="text-[10px] text-cyan-400/70 uppercase tracking-wider mt-0.5">
                            Step {completedStepsCount + 1} of {procedureSteps.length}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
