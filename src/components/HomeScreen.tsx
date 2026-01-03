// HomeScreen.tsx - Landing page with class selection and experiment list

import { useState } from 'react';
import { useLabStore } from '../store/labStore';
import { getExperimentsByClass, getTotalExperimentCount } from '../core/experiments';

export function HomeScreen() {
    const [selectedClass, setSelectedClass] = useState(6);
    const loadExperiment = useLabStore((state) => state.loadExperiment);
    const completedExperiments = useLabStore((state) => state.completedExperiments);
    const setExperimentMode = useLabStore((state) => state.setExperimentMode);

    const experiments = getExperimentsByClass(selectedClass);
    const totalExperiments = getTotalExperimentCount();
    const completedCount = completedExperiments.length;

    const handleExperimentSelect = (experimentId: string) => {
        loadExperiment(experimentId);
    };

    const handleSandboxMode = () => {
        setExperimentMode('sandbox');
    };

    return (
        <div className="home-screen">
            {/* Background effects */}
            <div className="home-bg-effects"></div>

            {/* Header */}
            <header className="home-header">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-2xl">
                    3D Chemistry Lab
                </h1>
                <p className="home-subtitle">NCERT Curriculum • Classes 6-8</p>
                {completedCount > 0 && (
                    <div className="progress-badge">
                        <span className="progress-icon">🏆</span>
                        {completedCount}/{totalExperiments} Completed
                    </div>
                )}
            </header>

            {/* Class Selector */}
            <div className="class-selector">
                {[6, 7, 8].map((classNum) => {
                    const classExperiments = getExperimentsByClass(classNum);
                    const classCompleted = classExperiments.filter(
                        (exp) => completedExperiments.includes(exp.id)
                    ).length;

                    return (
                        <button
                            key={classNum}
                            className={`class-btn ${selectedClass === classNum ? 'active' : ''}`}
                            onClick={() => setSelectedClass(classNum)}
                        >
                            <span className="class-number">{classNum}</span>
                            <span className="class-label">Class {classNum}</span>
                            {classCompleted > 0 && (
                                <span className="class-progress">
                                    {classCompleted}/{classExperiments.length} ✓
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Experiment List */}
            <div className="experiment-list">
                <h2 className="list-title">Class {selectedClass} Experiments</h2>
                <div className="experiment-cards">
                    {experiments.map((experiment, index) => {
                        const isCompleted = completedExperiments.includes(experiment.id);
                        return (
                            <div
                                key={experiment.id}
                                className={`experiment-card ${isCompleted ? 'completed' : ''}`}
                                onClick={() => handleExperimentSelect(experiment.id)}
                            >
                                <div className="card-icon">
                                    {isCompleted ? '✅' : `${index + 1}`}
                                </div>
                                <div className="card-content">
                                    <h3 className="card-title">{experiment.title}</h3>
                                    <p className="card-chapter">{experiment.chapter}</p>
                                </div>
                                <div className="card-arrow">→</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sandbox Mode Option */}
            <div className="sandbox-option">
                <button className="sandbox-btn" onClick={handleSandboxMode}>
                    <span className="sandbox-icon">🔬</span>
                    <span className="sandbox-text">Free Exploration Mode</span>
                    <span className="sandbox-desc">Open sandbox without guided steps</span>
                </button>
            </div>

            <style>{`
                .home-screen {
                    min-height: 100vh;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
                    position: relative;
                    overflow: hidden;
                }

                .home-bg-effects {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background:
                        radial-gradient(ellipse at 20% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 100%, rgba(0, 212, 255, 0.1) 0%, transparent 50%);
                    pointer-events: none;
                    animation: bgFloat 20s ease-in-out infinite;
                }

                @keyframes bgFloat {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-1%, 1%); }
                }

                .home-header {
                    text-align: center;
                    margin-bottom: 2.5rem;
                    position: relative;
                    z-index: 1;
                }

                .home-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .title-icon {
                    -webkit-text-fill-color: initial;
                    filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.5));
                }

                .home-subtitle {
                    font-size: 1.1rem;
                    color: #a0a0c0;
                    font-weight: 500;
                }

                .progress-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 20px;
                    color: #10b981;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .progress-icon {
                    font-size: 1rem;
                }

                .class-selector {
                    display: flex;
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                    position: relative;
                    z-index: 1;
                }

                .class-btn {
                    width: 130px;
                    height: 130px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    background: rgba(26, 26, 46, 0.8);
                    backdrop-filter: blur(10px);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.25rem;
                    color: white;
                    font-family: inherit;
                }

                .class-btn:hover {
                    border-color: #00d4ff;
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.25);
                }

                .class-btn.active {
                    border-color: #00d4ff;
                    background: linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%);
                    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
                }

                .class-number {
                    font-size: 2.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .class-label {
                    font-size: 0.85rem;
                    color: #a0a0c0;
                    font-weight: 500;
                }

                .class-progress {
                    font-size: 0.7rem;
                    color: #10b981;
                    font-weight: 600;
                    margin-top: 0.25rem;
                }

                .experiment-list {
                    width: 100%;
                    max-width: 700px;
                    position: relative;
                    z-index: 1;
                }

                .list-title {
                    font-size: 1.1rem;
                    color: #a0a0c0;
                    font-weight: 600;
                    margin-bottom: 1rem;
                }

                .experiment-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .experiment-card {
                    background: rgba(26, 26, 46, 0.8);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-left: 4px solid #00d4ff;
                    border-radius: 12px;
                    padding: 1rem 1.25rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .experiment-card:hover {
                    border-color: #00d4ff;
                    transform: translateX(8px);
                    box-shadow: 0 4px 20px rgba(0, 212, 255, 0.15);
                }

                .experiment-card.completed {
                    border-left-color: #10b981;
                }

                .experiment-card.completed:hover {
                    border-color: #10b981;
                }

                .card-icon {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1rem;
                    color: white;
                    flex-shrink: 0;
                }

                .experiment-card.completed .card-icon {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }

                .card-content {
                    flex: 1;
                }

                .card-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 0.25rem;
                }

                .card-chapter {
                    font-size: 0.85rem;
                    color: #a0a0c0;
                }

                .card-arrow {
                    font-size: 1.5rem;
                    color: #00d4ff;
                    transition: transform 0.3s ease;
                }

                .experiment-card:hover .card-arrow {
                    transform: translateX(4px);
                }

                .sandbox-option {
                    margin-top: 2rem;
                    position: relative;
                    z-index: 1;
                }

                .sandbox-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 1rem 2rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px dashed rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    color: white;
                    font-family: inherit;
                }

                .sandbox-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.4);
                }

                .sandbox-icon {
                    font-size: 1.5rem;
                }

                .sandbox-text {
                    font-size: 0.95rem;
                    font-weight: 600;
                }

                .sandbox-desc {
                    font-size: 0.75rem;
                    color: #a0a0c0;
                }

                @media (max-width: 600px) {
                    .home-screen {
                        padding: 1rem;
                    }

                    .home-title {
                        font-size: 1.75rem;
                    }

                    .class-selector {
                        gap: 0.75rem;
                    }

                    .class-btn {
                        width: 90px;
                        height: 90px;
                    }

                    .class-number {
                        font-size: 1.75rem;
                    }

                    .experiment-card {
                        padding: 0.75rem 1rem;
                    }

                    .card-icon {
                        width: 36px;
                        height: 36px;
                        font-size: 0.85rem;
                    }

                    .card-title {
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </div>
    );
}
