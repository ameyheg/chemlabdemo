import { useLabStore } from '../store/labStore';

// Safety Warning Popup - Shows for dangerous events (broken glass, explosions)
export function SafetyWarningPopup() {
    const safetyWarning = useLabStore((state) => state.safetyWarning);
    const dismissSafetyWarning = useLabStore((state) => state.dismissSafetyWarning);

    if (!safetyWarning) return null;

    return (
        <div className="safety-overlay">
            <div className="safety-popup">
                <div className="warning-icon">⚠️</div>
                <h2 className="safety-title">{safetyWarning.title}</h2>
                <p className="safety-message">{safetyWarning.message}</p>
                <button className="btn-caution" onClick={dismissSafetyWarning}>
                    Got it!
                </button>
            </div>
            <style>{`
                /* Styles adapted for Safety-Themed (Amber/Red) Warning */
                .safety-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000; /* Higher than normal UI */
                    animation: fadeIn 0.2s ease;
                }
                .safety-popup {
                    background: linear-gradient(135deg, #2e1a1a 0%, #3e1616 100%);
                    border: 1px solid rgba(255, 69, 0, 0.4);
                    border-radius: 16px;
                    padding: 2rem;
                    text-align: center;
                    max-width: 380px;
                    width: 90%;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 69, 0, 0.1);
                    animation: popupSlide 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popupSlide {
                    0% { transform: scale(0.8) translateY(20px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                .warning-icon {
                    font-size: 3.5rem; margin-bottom: 0.5rem;
                    animation: wobble 1s ease-in-out infinite;
                }
                @keyframes wobble {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
                .safety-title {
                    font-size: 1.5rem; font-weight: 700;
                    color: #ff6b6b; margin-bottom: 0.5rem;
                }
                .safety-message {
                    color: #d0d0d0; font-size: 1rem; line-height: 1.5;
                    margin-bottom: 1.5rem;
                }
                .btn-caution {
                    background: linear-gradient(to right, #ff416c, #ff4b2b);
                    border: none; border-radius: 8px;
                    padding: 0.8rem 1.5rem; color: white;
                    font-weight: 600; cursor: pointer;
                    transition: transform 0.2s;
                    box-shadow: 0 4px 15px rgba(255, 75, 43, 0.4);
                }
                .btn-caution:hover { transform: scale(1.05); }
            `}</style>
        </div>
    );
}
