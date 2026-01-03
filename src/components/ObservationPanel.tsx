// ObservationPanel.tsx - Shows observations, explanations, and procedure steps

import { useState, useEffect } from 'react';
import { useLabStore } from '../store/labStore';

interface ObservationPanelProps {
    onMarkComplete?: () => void;
    layout?: 'mobile' | 'desktop'; // Debug prop
}

export function ObservationPanel({ onMarkComplete, layout = 'desktop' }: ObservationPanelProps) {
    const currentExperiment = useLabStore((state) => state.currentExperiment);
    const currentObservation = useLabStore((state) => state.currentObservation);
    const currentExplanation = useLabStore((state) => state.currentExplanation);
    const showExplanation = useLabStore((state) => state.showExplanation);
    const experimentActions = useLabStore((state) => state.experimentActions);
    const addedChemicals = useLabStore((state) => state.addedChemicals);
    const placedApparatus = useLabStore((state) => state.placedApparatus);
    const resetExperiment = useLabStore((state) => state.resetExperiment);
    const completedExperiments = useLabStore((state) => state.completedExperiments);
    const performExperimentAction = useLabStore((state) => state.performExperimentAction);
    const checkExperimentReaction = useLabStore((state) => state.checkExperimentReaction);
    const showResetPrompt = useLabStore((state) => state.showResetPrompt);
    const resetPromptMessage = useLabStore((state) => state.resetPromptMessage);
    const isAutoPouring = useLabStore((state) => state.isAutoPouring);
    const bunsenBurnerOn = useLabStore((state) => state.bunsenBurnerOn);

    // Salt-dissolution phase tracking
    const saltTested = useLabStore((state) => state.saltTested);
    const resetAfterSaltTest = useLabStore((state) => state.resetAfterSaltTest);

    // Physical-Chemical phase tracking
    const iceTested = useLabStore((state) => state.iceTested);
    const paperTested = useLabStore((state) => state.paperTested);

    // Neutralization tracking
    const neutralizationDropCount = useLabStore((state) => state.neutralizationDropCount);
    const neutralizationComplete = useLabStore((state) => state.neutralizationComplete);

    const isAlreadyCompleted = currentExperiment ? completedExperiments.includes(currentExperiment.id) : false;

    // For multi-phase experiments like salt-dissolution, don't show manual mark complete
    const isMultiPhaseExperiment = currentExperiment?.id === 'salt-dissolution';

    const [isStepsCollapsed, setIsStepsCollapsed] = useState(false);

    if (!currentExperiment) return null;

    // Determine step progress - use dynamic steps for salt-dissolution
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

    // Calculate base actions count (apparatus + chemicals + actions)
    let currentPhaseActions = placedApparatus.length + addedChemicals.length + experimentActions.length;

    // Adjust for burner actions (toggle counts as action but might not be in array? Check valid actions)
    // Actually simplicity is better: just count items.

    // For Physical-Chemical (Exp 4), we need to add offsets based on completed phases
    // Phase 1 (Ice) = Steps 1-6 (6 steps)
    // Phase 2 (Paper) = Steps 7-11 (5 steps)
    // Phase 3 (Magnesium) = Steps 12-15 (4 steps)

    let stepOffset = 0;
    if (currentExperiment.id === 'physical-chemical') {
        // Use showResetPrompt to distinguish between "Cleanup Phase" and "Next Phase Execution"
        // When reaction completes: X_Tested = true AND showResetPrompt = true
        // After reset clicked: showResetPrompt = false (but X_Tested remains true)

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

    // RE-ADDING DEBUG LOGS to diagnose persistent issue
    if (currentExperiment.id === 'physical-chemical') {
        console.log(`Step Reset Debug [${layout.toUpperCase()}]:`, {
            iceTested,
            paperTested,
            showResetPrompt,
            stepOffset,
            currentPhaseActions,
            totalSteps: procedureSteps.length,
            completedStepsCount
        });
    }

    // Auto-collapse steps when all completed
    useEffect(() => {
        if (completedStepsCount === procedureSteps.length && procedureSteps.length > 0) {
            setIsStepsCollapsed(true);
        }
    }, [completedStepsCount, procedureSteps.length]);

    // Get available actions based on experiment needs and current state
    const getAvailableActions = () => {
        const actions: { id: string; label: string; emoji: string }[] = [];

        // Check if chemicals have been added (prerequisite for most actions)
        if (addedChemicals.length === 0) return actions;

        // Common actions based on experiment reactions
        const reactionKeys = Object.keys(currentExperiment.reactions);

        if (reactionKeys.some(k => k.includes('stir')) && !experimentActions.includes('stir')) {
            // For salt-dissolution, require glass-rod to be placed before stirring is available
            const canStir = currentExperiment.id !== 'salt-dissolution' || placedApparatus.includes('glass-rod');
            if (canStir) {
                actions.push({ id: 'stir', label: 'Stir', emoji: '🥄' });
            }
        }
        if (reactionKeys.some(k => k.includes('heat')) && !experimentActions.includes('heat')) {
            // Skip Heat action for evaporation - evaporation is automatic when burner is on
            if (currentExperiment.id !== 'evaporation') {
                actions.push({ id: 'heat', label: 'Heat', emoji: '🔥' });
            }
        }
        if (reactionKeys.some(k => k.includes('filter')) && !experimentActions.includes('filter') && currentExperiment.id !== 'filtration') {
            actions.push({ id: 'filter', label: 'Filter', emoji: '☕' });
        }
        if (reactionKeys.some(k => k.includes('evaporate')) && !experimentActions.includes('evaporate') && currentExperiment.id !== 'evaporation') {
            actions.push({ id: 'evaporate', label: 'Evaporate', emoji: '💨' });
        }

        return actions;
    };

    const availableActions = getAvailableActions();

    const handleAction = (actionId: string) => {
        performExperimentAction(actionId);
        // Don't call checkExperimentReaction for 'stir' - it's called after the 4-second timer in labStore
        if (actionId !== 'stir') {
            setTimeout(() => checkExperimentReaction(), 100);
        }
    };

    // Observation Table for Neutralization
    const renderNeutralizationTable = () => {
        if (currentExperiment.id !== 'neutralization') return null;

        const rows = [];
        // Row 1: NaOH
        if (addedChemicals.includes('naoh')) {
            rows.push({
                step: 'Initial Solution',
                observation: 'Clear, colorless NaOH solution',
                inference: 'Sodium Hydroxide is a strong BASE'
            });
        }
        // Row 2: Phenol
        if (addedChemicals.includes('phenolphthalein')) {
            rows.push({
                step: '+ Phenolphthalein',
                observation: 'Solution turns PINK 💗',
                inference: 'Indicates presence of base'
            });
        }
        // Row 3: HCl
        if (neutralizationDropCount > 0) {
            const isComplete = neutralizationDropCount >= 5 || neutralizationComplete;
            rows.push({
                step: `+ Dilute HCl (${neutralizationDropCount} drops)`,
                observation: isComplete ? 'Solution turns colorless ⚪' : 'Pink color is fading',
                inference: isComplete ? 'NEUTRALIZED (Salt + Water formed)' : 'Neutralization process'
            });
        }

        if (rows.length === 0) return null;

        return (
            <div className="observation-table-container">
                <table className="observation-table">
                    <thead>
                        <tr>
                            <th>Step</th>
                            <th>Observation</th>
                            <th>Inference</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i}>
                                <td>{row.step}</td>
                                <td>{row.observation}</td>
                                <td>{row.inference}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="observation-panel">
            <h3 className="panel-title">
                <span className="title-icon">👁️</span>
                Observation
            </h3>

            {/* Reset Banner - prominent prompt between phases */}
            {showResetPrompt && (
                <div className="reset-banner" onClick={() => resetExperiment()}>
                    <span className="reset-icon">🔄</span>
                    <span>{resetPromptMessage}</span>
                    <span className="arrow-icon">👆</span>
                </div>
            )}

            {/* Neutralization Table */}
            {renderNeutralizationTable()}

            {/* Current observation */}
            <p className={`observation-text ${showExplanation ? 'success' : 'hint'}`}>
                {currentObservation}
            </p>

            {/* Procedure Steps - Collapsible */}
            {procedureSteps.length > 0 && (
                <div className="procedure-steps">
                    <div
                        className="steps-header"
                        onClick={() => setIsStepsCollapsed(!isStepsCollapsed)}
                        role="button"
                        tabIndex={0}
                    >
                        <h4 className="steps-title">
                            📋 Procedure ({completedStepsCount}/{procedureSteps.length})
                        </h4>
                        <span
                            className="steps-toggle-icon"
                            style={{
                                transform: isStepsCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                                display: 'inline-block'
                            }}
                        >
                            ▼
                        </span>
                    </div>

                    {!isStepsCollapsed && (
                        <div className="steps-list">
                            {procedureSteps.map((step, index) => {
                                let isCompleted = index < completedStepsCount;
                                const isCurrent = index === completedStepsCount;

                                // Check for specific error: Missed Salt Solution in Evaporation
                                // Step 4 (index 3) is "Add salt solution"
                                const isMissedSaltStep = currentExperiment.id === 'evaporation' &&
                                    index === 3 &&
                                    bunsenBurnerOn &&
                                    !addedChemicals.includes('salt-solution');

                                if (isMissedSaltStep) {
                                    isCompleted = false; // Override completion
                                }

                                return (
                                    <div
                                        key={index}
                                        className={`step-item 
                                            ${isCompleted ? 'completed' : ''} 
                                            ${isCurrent && !isMissedSaltStep ? 'current' : ''}
                                            ${isMissedSaltStep ? 'error' : ''}
                                        `}
                                    >
                                        <div className="step-marker">
                                            {isCompleted ? '✓' : isMissedSaltStep ? '!' : (index + 1)}
                                        </div>
                                        <p className="step-text">{step}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Pour Button for Filtration - Replaces complex drag/tilt */}
            {currentExperiment?.id === 'filtration' &&
                placedApparatus.includes('beaker') &&
                placedApparatus.includes('funnel') &&
                placedApparatus.includes('filter-paper') &&
                addedChemicals.includes('muddy-water') && (
                    <div className="action-buttons" style={{ marginTop: '0.5rem' }}>
                        <button
                            className={`action-btn w-full justify-center transition-all duration-200 
                            ${isAutoPouring ? 'bg-blue-600 scale-95' : 'bg-blue-500 hover:bg-blue-400'}`}
                            style={{ background: isAutoPouring ? '#2563eb' : '#3b82f6', height: '50px' }}
                            onPointerDown={() => useLabStore.getState().setAutoPouring(true)}
                            onPointerUp={() => useLabStore.getState().setAutoPouring(false)}
                            onPointerLeave={() => useLabStore.getState().setAutoPouring(false)}
                        >
                            <span className="action-emoji" style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🫗</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Hold to Pour</span>
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-2 italic">
                            Keep pressed to pour muddy water
                        </p>
                    </div>
                )}

            {/* Action Buttons - appear when chemicals are added */}
            {availableActions.length > 0 && (
                <div className="action-buttons">
                    <p className="action-hint">Next step:</p>
                    <div className="actions-row">
                        {availableActions.map((action) => (
                            <button
                                key={action.id}
                                className="action-btn"
                                onClick={() => handleAction(action.id)}
                            >
                                <span className="action-emoji">{action.emoji}</span>
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Explanation box */}
            {showExplanation && currentExplanation && (
                <div className="explanation-box">
                    <h4 className="explanation-title">
                        <span className="explanation-icon">💡</span>
                        What happened?
                    </h4>
                    <p className="explanation-text">{currentExplanation}</p>
                </div>
            )}

            {/* Mark Complete button - NOT shown for multi-phase experiments */}
            {showExplanation && !isAlreadyCompleted && onMarkComplete && !isMultiPhaseExperiment && (
                <button className="complete-btn" onClick={onMarkComplete}>
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Mark Experiment Complete
                </button>
            )}

            {/* Already completed badge */}
            {isAlreadyCompleted && (
                <div className="completed-badge">
                    <span>✅ Completed</span>
                </div>
            )}

            {/* Reset button */}
            <button className={`reset-btn ${showResetPrompt ? 'highlight' : ''}`} onClick={() => resetExperiment()}>
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
                Reset Experiment
            </button>

            {/* Clear Progress button for testing */}
            <button
                className="clear-progress-btn"
                onClick={() => {
                    localStorage.removeItem('completedExperiments');
                    window.location.reload();
                }}
                title="Clear all progress (for testing)"
            >
                🧹 Clear Progress
            </button>

            <style>{`
                .observation-panel {
                    background: linear-gradient(180deg, rgba(26, 26, 46, 0.98) 0%, rgba(22, 33, 62, 0.95) 100%);
                    border: 1px solid rgba(0, 212, 255, 0.15);
                    border-radius: 16px;
                    padding: 1.25rem;
                    backdrop-filter: blur(10px);
                    max-height: 400px;
                    overflow-y: auto;
                }

                .panel-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #00d4ff;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .title-icon {
                    font-size: 1.1rem;
                    filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.5));
                }

                .observation-table-container {
                    margin-bottom: 1rem;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(0, 212, 255, 0.2);
                    background: rgba(0, 0, 0, 0.2);
                }

                .observation-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                    color: #fff;
                }

                .observation-table th {
                    background: rgba(0, 212, 255, 0.1);
                    color: #00d4ff;
                    text-align: left;
                    padding: 0.75rem;
                    font-weight: 600;
                    border-bottom: 1px solid rgba(0, 212, 255, 0.2);
                }

                .observation-table td {
                    padding: 0.75rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    line-height: 1.4;
                }

                .observation-table tr:last-child td {
                    border-bottom: none;
                }

                .observation-table tr:nth-child(even) {
                    background: rgba(255, 255, 255, 0.02);
                }

                .observation-text {
                    font-size: 1rem;
                    line-height: 1.7;
                    color: #e0e0e0;
                    font-weight: 500;
                    margin-bottom: 1rem;
                }

                .observation-text.hint {
                    color: #a0a0c0;
                    font-style: italic;
                }

                .observation-text.success {
                    color: #10b981;
                    text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
                }

                .procedure-steps {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(124, 58, 237, 0.06) 100%);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.3s ease;
                }

                .steps-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    padding-bottom: 0.5rem;
                }
                
                .steps-toggle-icon {
                    transition: transform 0.3s ease;
                    opacity: 0.7;
                    font-size: 0.8rem;
                    color: #00d4ff;
                }

                .steps-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #a0a0c0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin: 0;
                }

                .steps-list {
                    margin-top: 0.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    animation: slideDown 0.3s ease-out;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .step-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.8rem;
                    padding: 0.5rem;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }

                .step-item.current {
                    background: rgba(0, 212, 255, 0.1);
                    border-color: rgba(0, 212, 255, 0.3);
                }

                .step-item.completed {
                    opacity: 0.6;
                }

                .step-marker {
                    min-width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: bold;
                    color: #fff;
                }

                .step-item.current .step-marker {
                    background: #00d4ff;
                    color: #000;
                    box-shadow: 0 0 10px rgba(0, 212, 255, 0.4);
                }
                
                .step-item.completed .step-marker {
                    background: #10b981;
                    color: #fff;
                }

                /* Error State for Missed Steps */
                .step-item.error {
                    border: 1px solid #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                    box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                .step-item.error .step-marker {
                    background: #ef4444;
                    color: white;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }

                .step-text {
                    font-size: 0.9rem;
                    line-height: 1.4;
                    color: #d0d0d0;
                    margin: 0;
                }

                .explanation-box {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%);
                    border-radius: 12px;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-left: 4px solid #10b981;
                    animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .explanation-title {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #10b981;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .explanation-icon {
                    font-size: 1rem;
                }

                .explanation-text {
                    color: #e0e0e0;
                    font-size: 0.9rem;
                    line-height: 1.7;
                }

                .reset-btn {
                    width: 100%;
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: #a0a0c0;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-family: inherit;
                }

                .reset-btn:hover {
                    background: rgba(0, 212, 255, 0.1);
                    border-color: rgba(0, 212, 255, 0.3);
                    color: #00d4ff;
                }

                .reset-btn svg {
                    transition: transform 0.3s ease;
                }

                .reset-btn:hover svg {
                    transform: rotate(-180deg);
                }

                .clear-progress-btn {
                    width: 100%;
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 8px;
                    color: #ef4444;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .clear-progress-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.5);
                }

                .complete-btn {
                    width: 100%;
                    margin-top: 1rem;
                    padding: 0.875rem;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-family: inherit;
                }

                .complete-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
                }

                .completed-badge {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 10px;
                    text-align: center;
                    color: #10b981;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .action-buttons {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(255, 100, 0, 0.05) 100%);
                    border: 1px solid rgba(255, 165, 0, 0.3);
                    border-radius: 10px;
                }

                .action-hint {
                    margin: 0 0 0.5rem 0;
                    font-size: 0.75rem;
                    color: #ffa500;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .actions-row {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 0.75rem;
                    background: linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .action-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 15px rgba(255, 140, 0, 0.4);
                }

                .action-emoji {
                    font-size: 1rem;
                }

                /* Reset Banner for multi-phase experiments */
                .reset-banner {
                    background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-weight: 700;
                    text-align: center;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 1rem;
                    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4), 0 0 30px rgba(239, 68, 68, 0.2);
                    animation: resetBannerPulse 1.5s ease-in-out infinite;
                    font-size: 0.9rem;
                }

                .reset-banner:hover {
                    transform: scale(1.02);
                    box-shadow: 0 6px 25px rgba(245, 158, 11, 0.6), 0 0 40px rgba(239, 68, 68, 0.4);
                }

                .reset-icon {
                    font-size: 1.2rem;
                }

                .arrow-icon {
                    font-size: 1rem;
                    animation: pointUp 1s ease-in-out infinite;
                }

                @keyframes resetBannerPulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.02);
                    }
                }

                @keyframes pointUp {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-4px);
                    }
                }

                .reset-btn.highlight {
                    background: linear-gradient(135deg, #f59e0b 0%, #ff6b00 100%) !important;
                    animation: resetBtnPulse 1.5s ease-in-out infinite;
                    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
                }

                @keyframes resetBtnPulse {
                    0%, 100% {
                        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
                    }
                    50% {
                        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
                    }
                }
            `}</style>
        </div>
    );
}
