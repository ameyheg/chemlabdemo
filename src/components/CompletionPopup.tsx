// CompletionPopup.tsx - Shows when an experiment is completed

import { useLabStore } from '../store/labStore';
import { getAllExperiments } from '../core/experiments';

interface CompletionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onViewLabRecord: () => void;
    onNextExperiment?: () => void;
}

export function CompletionPopup({
    isOpen,
    onClose,
    onViewLabRecord,
    onNextExperiment,
}: CompletionPopupProps) {
    const currentExperiment = useLabStore((state) => state.currentExperiment);
    const completedExperiments = useLabStore((state) => state.completedExperiments);
    const resetExperiment = useLabStore((state) => state.resetExperiment);

    if (!isOpen || !currentExperiment) return null;

    const allExperiments = getAllExperiments();
    const totalExperiments = allExperiments.length;
    const completedCount = completedExperiments.length;
    const isAllComplete = completedCount >= totalExperiments;

    // Find next experiment
    const currentIndex = allExperiments.findIndex((e) => e.id === currentExperiment.id);
    const hasNextExperiment = currentIndex < allExperiments.length - 1;

    const handleRerun = () => {
        resetExperiment();
        onClose();
    };

    return (
        <div className="completion-overlay">
            <div className={`completion-popup ${isAllComplete ? 'all-complete' : ''}`}>
                {isAllComplete ? (
                    <>
                        <div className="stars">
                            <span className="star">⭐</span>
                            <span className="star">⭐</span>
                            <span className="star">⭐</span>
                        </div>
                        <div className="trophy-icon all">🏆</div>
                        <h2 className="completion-title grand">CONGRATULATIONS!</h2>
                        <p className="completion-message">
                            Amazing! You've completed ALL experiments in the Virtual Chemistry Lab!
                            You're now a certified young scientist!
                        </p>
                        <button className="btn-certificate" onClick={onViewLabRecord}>
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path
                                    fill="currentColor"
                                    d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
                                />
                            </svg>
                            View Lab Record
                        </button>
                        <div className="secondary-actions">
                            <button className="btn-secondary" onClick={onClose}>
                                Close
                            </button>
                        </div>
                        <div className="confetti-container">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="confetti"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${2 + Math.random() * 2}s`,
                                        backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700'][
                                            Math.floor(Math.random() * 7)
                                        ],
                                    }}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="trophy-icon">🏆</div>
                        <h2 className="completion-title">Experiment Complete!</h2>
                        <p className="completion-message">
                            Great job! You've successfully completed "{currentExperiment.title}"
                        </p>
                        <button className="btn-primary" onClick={onViewLabRecord}>
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path
                                    fill="currentColor"
                                    d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
                                />
                            </svg>
                            View Lab Record
                        </button>
                        <div className="secondary-actions">
                            <button className="btn-secondary" onClick={handleRerun}>
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path
                                        fill="currentColor"
                                        d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                                    />
                                </svg>
                                Rerun
                            </button>
                            {hasNextExperiment && onNextExperiment && (
                                <button className="btn-secondary" onClick={onNextExperiment}>
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                                    </svg>
                                    Next Experiment
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .completion-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .completion-popup {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 1px solid rgba(0, 212, 255, 0.2);
                    border-radius: 24px;
                    padding: 2.5rem;
                    text-align: center;
                    max-width: 420px;
                    width: 90%;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 212, 255, 0.1);
                    animation: popupBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    position: relative;
                    overflow: hidden;
                }

                .completion-popup.all-complete {
                    border-color: rgba(255, 215, 0, 0.4);
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.2);
                }

                @keyframes popupBounce {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); opacity: 1; }
                }

                .stars {
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .star {
                    font-size: 2rem;
                    animation: starPulse 1s ease-in-out infinite;
                }

                .star:nth-child(2) { animation-delay: 0.2s; }
                .star:nth-child(3) { animation-delay: 0.4s; }

                @keyframes starPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                }

                .trophy-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    animation: trophyBounce 0.6s ease-in-out;
                }

                .trophy-icon.all {
                    font-size: 5rem;
                    filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
                }

                @keyframes trophyBounce {
                    0% { transform: scale(0) rotate(-10deg); }
                    50% { transform: scale(1.2) rotate(5deg); }
                    70% { transform: scale(0.9) rotate(-3deg); }
                    100% { transform: scale(1) rotate(0); }
                }

                .completion-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 0.75rem;
                }

                .completion-title.grand {
                    font-size: 2rem;
                    background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #ffd700 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                }

                .completion-message {
                    color: #a0a0c0;
                    font-size: 1rem;
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                }

                .btn-primary, .btn-certificate {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.5rem;
                    background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                    width: 100%;
                }

                .btn-certificate {
                    background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
                }

                .btn-primary:hover, .btn-certificate:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
                }

                .secondary-actions {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 1rem;
                }

                .btn-secondary {
                    flex: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    color: #a0a0c0;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    color: white;
                }

                .confetti-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    overflow: hidden;
                }

                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    top: -10px;
                    animation: confettiFall 3s linear infinite;
                }

                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
