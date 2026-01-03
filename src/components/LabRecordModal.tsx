// LabRecordModal.tsx - Displays experiment details and allows PDF export

import { useState } from 'react';
import { useLabStore } from '../store/labStore';
import { getAllExperiments, getTotalExperimentCount } from '../core/experiments';

interface LabRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LabRecordModal({ isOpen, onClose }: LabRecordModalProps) {
    const currentExperiment = useLabStore((state) => state.currentExperiment);
    const completedExperiments = useLabStore((state) => state.completedExperiments);
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen || !currentExperiment) return null;

    const allComplete = completedExperiments.length >= getTotalExperimentCount();

    const sanitizeForPdf = (text: string): string => {
        return text
            .replace(/⁺/g, '+')
            .replace(/⁻/g, '-')
            .replace(/₂/g, '2')
            .replace(/→/g, '->')
            .replace(/📋|💡|🔴|🔵|💗|⚪|🏆|⭐|✅|✓/g, '')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"');
    };

    const generatePdf = async (action: 'download' | 'preview') => {
        setIsExporting(true);
        try {
            // Dynamically import jsPDF
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Title
            doc.setFontSize(18);
            doc.setTextColor(0, 100, 150);
            doc.text('Virtual Chemistry Lab - Lab Record', 105, 20, { align: 'center' });

            // Experiment title
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text(sanitizeForPdf(currentExperiment.title), 105, 35, { align: 'center' });

            // Class and Chapter
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Class ${currentExperiment.classLevel} | ${currentExperiment.chapter}`, 105, 42, { align: 'center' });

            let yPos = 55;

            // Aim
            doc.setFontSize(12);
            doc.setTextColor(0, 80, 120);
            doc.text('AIM:', 20, yPos);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            const aimLines = doc.splitTextToSize(sanitizeForPdf(currentExperiment.aim), 170);
            doc.text(aimLines, 20, yPos + 7);
            yPos += 7 + aimLines.length * 6 + 5;

            // Apparatus
            doc.setFontSize(12);
            doc.setTextColor(0, 80, 120);
            doc.text('APPARATUS REQUIRED:', 20, yPos);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            const apparatusText = currentExperiment.apparatus.map(a => a.replace(/-/g, ' ')).join(', ');
            const apparatusLines = doc.splitTextToSize(apparatusText, 170);
            doc.text(apparatusLines, 20, yPos + 7);
            yPos += 7 + apparatusLines.length * 6 + 5;

            // Chemicals
            doc.setFontSize(12);
            doc.setTextColor(0, 80, 120);
            doc.text('CHEMICALS USED:', 20, yPos);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            const chemicalsText = currentExperiment.chemicals.map(c => c.name).join(', ');
            const chemicalsLines = doc.splitTextToSize(chemicalsText, 170);
            doc.text(chemicalsLines, 20, yPos + 7);
            yPos += 7 + chemicalsLines.length * 6 + 5;

            // Procedure
            if (currentExperiment.procedureSteps && currentExperiment.procedureSteps.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(0, 80, 120);
                doc.text('PROCEDURE:', 20, yPos);
                yPos += 7;
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(11);
                currentExperiment.procedureSteps.forEach((step, index) => {
                    const stepText = `${index + 1}. ${sanitizeForPdf(step)}`;
                    const stepLines = doc.splitTextToSize(stepText, 165);
                    doc.text(stepLines, 25, yPos);
                    yPos += stepLines.length * 6;
                });
                yPos += 5;
            }

            // Observations
            doc.setFontSize(12);
            doc.setTextColor(0, 80, 120);
            doc.text('OBSERVATIONS:', 20, yPos);
            yPos += 7;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            Object.values(currentExperiment.reactions).forEach((reaction) => {
                if (reaction.success) {
                    const obsText = sanitizeForPdf(`• ${reaction.observation}`);
                    const obsLines = doc.splitTextToSize(obsText, 165);
                    if (yPos + obsLines.length * 6 > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(obsLines, 25, yPos);
                    yPos += obsLines.length * 6 + 2;
                }
            });
            yPos += 5;

            // Conclusion
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(12);
            doc.setTextColor(0, 80, 120);
            doc.text('CONCLUSION:', 20, yPos);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            const conclusionLines = doc.splitTextToSize(sanitizeForPdf(currentExperiment.conclusion), 170);
            doc.text(conclusionLines, 20, yPos + 7);

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Generated by Virtual Chemistry Lab on ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });

            const safeTitle = currentExperiment.title.replace(/[^a-z0-9]/gi, '_');
            const filename = `${safeTitle}_Lab_Report.pdf`;

            if (action === 'download') {
                doc.save(filename);
            } else {
                // Preview in new tab
                const blob = doc.output('blob');
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const exportCertificate = async () => {
        if (!allComplete) return;
        setIsExporting(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF('landscape');

            // Background color
            doc.setFillColor(15, 15, 35);
            doc.rect(0, 0, 297, 210, 'F');

            // Border
            doc.setDrawColor(0, 212, 255);
            doc.setLineWidth(3);
            doc.rect(10, 10, 277, 190, 'S');

            // Second border
            doc.setDrawColor(124, 58, 237);
            doc.setLineWidth(1);
            doc.rect(15, 15, 267, 180, 'S');

            // Title
            doc.setFontSize(36);
            doc.setTextColor(0, 212, 255);
            doc.text('CERTIFICATE OF COMPLETION', 148.5, 50, { align: 'center' });

            // Subtitle
            doc.setFontSize(14);
            doc.setTextColor(160, 160, 192);
            doc.text('This is to certify that', 148.5, 75, { align: 'center' });

            // Student placeholder
            doc.setFontSize(24);
            doc.setTextColor(255, 255, 255);
            doc.text('________________________', 148.5, 95, { align: 'center' });

            // Has completed text
            doc.setFontSize(14);
            doc.setTextColor(160, 160, 192);
            doc.text('has successfully completed all experiments in the', 148.5, 115, { align: 'center' });

            // Program name
            doc.setFontSize(20);
            doc.setTextColor(124, 58, 237);
            doc.text('Virtual Chemistry Lab', 148.5, 130, { align: 'center' });

            // Experiments completed
            doc.setFontSize(12);
            doc.setTextColor(160, 160, 192);
            const allExps = getAllExperiments();
            doc.text(`Completed ${allExps.length} experiments across NCERT Classes 6-8`, 148.5, 145, { align: 'center' });

            // Date
            doc.setFontSize(10);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 148.5, 165, { align: 'center' });

            // Trophy emoji representation
            doc.setFontSize(40);
            doc.setTextColor(255, 215, 0);
            doc.text('*', 148.5, 185, { align: 'center' });

            doc.save('chemistry-lab-certificate.pdf');
        } catch (error) {
            console.error('Certificate export failed:', error);
            alert('Failed to export certificate. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="lab-record-overlay" onClick={onClose}>
            <div className="lab-record-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>

                <div className="modal-header">
                    <h2 className="modal-title">📋 Lab Record</h2>
                    <p className="modal-subtitle">{currentExperiment.title}</p>
                </div>

                <div className="modal-content">
                    <section className="record-section">
                        <h3 className="section-title">📌 Aim</h3>
                        <p className="section-text">{currentExperiment.aim}</p>
                    </section>

                    <section className="record-section">
                        <h3 className="section-title">🔧 Apparatus Required</h3>
                        <ul className="item-list">
                            {currentExperiment.apparatus.map((item, i) => (
                                <li key={i}>{item.replace(/-/g, ' ')}</li>
                            ))}
                        </ul>
                    </section>

                    <section className="record-section">
                        <h3 className="section-title">🧪 Chemicals Used</h3>
                        <ul className="item-list">
                            {currentExperiment.chemicals.map((chem, i) => (
                                <li key={i}>
                                    <span className="chem-color" style={{ background: chem.color }}></span>
                                    {chem.name}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {currentExperiment.procedureSteps && (
                        <section className="record-section">
                            <h3 className="section-title">📝 Procedure</h3>
                            <ol className="procedure-list">
                                {currentExperiment.procedureSteps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ol>
                        </section>
                    )}

                    <section className="record-section">
                        <h3 className="section-title">👁️ Observations</h3>
                        {Object.entries(currentExperiment.reactions).map(([key, reaction]) =>
                            reaction.success ? (
                                <div key={key} className="observation-item">
                                    <p>{reaction.observation}</p>
                                </div>
                            ) : null
                        )}
                    </section>

                    <section className="record-section">
                        <h3 className="section-title">✅ Conclusion</h3>
                        <p className="section-text conclusion">{currentExperiment.conclusion}</p>
                    </section>
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-preview"
                        onClick={() => generatePdf('preview')}
                        disabled={isExporting}
                    >
                        👁️ Preview
                    </button>
                    <button
                        className="btn-export"
                        onClick={() => generatePdf('download')}
                        disabled={isExporting}
                    >
                        {isExporting ? 'Generating...' : '📄 Download PDF'}
                    </button>
                    {allComplete && (
                        <button
                            className="btn-certificate"
                            onClick={exportCertificate}
                            disabled={isExporting}
                        >
                            🏆 Download Certificate
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                .lab-record-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .lab-record-modal {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 1px solid rgba(0, 212, 255, 0.2);
                    border-radius: 20px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 85vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .close-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 32px;
                    height: 32px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    color: #a0a0c0;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .modal-header {
                    padding: 1.5rem 2rem 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .modal-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 0.25rem;
                }

                .modal-subtitle {
                    color: #a0a0c0;
                    font-size: 0.9rem;
                }

                .modal-content {
                    padding: 1.5rem 2rem;
                    overflow-y: auto;
                    flex: 1;
                }

                .record-section {
                    margin-bottom: 1.5rem;
                }

                .record-section:last-child {
                    margin-bottom: 0;
                }

                .section-title {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #00d4ff;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .section-text {
                    color: #e0e0e0;
                    font-size: 0.95rem;
                    line-height: 1.6;
                }

                .section-text.conclusion {
                    background: rgba(16, 185, 129, 0.1);
                    padding: 1rem;
                    border-radius: 10px;
                    border-left: 3px solid #10b981;
                }

                .item-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .item-list li {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    color: #e0e0e0;
                    font-size: 0.85rem;
                    text-transform: capitalize;
                }

                .chem-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 3px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .procedure-list {
                    margin: 0;
                    padding-left: 1.25rem;
                    color: #e0e0e0;
                    font-size: 0.9rem;
                    line-height: 1.8;
                }

                .observation-item {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    border-left: 3px solid #7c3aed;
                }

                .observation-item p {
                    margin: 0;
                    color: #e0e0e0;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .modal-footer {
                    padding: 1rem 2rem 1.5rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    gap: 0.75rem;
                }

                .btn-export, .btn-certificate, .btn-preview {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .btn-preview {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }

                .btn-export {
                    background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
                    color: white;
                }

                .btn-certificate {
                    background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
                    color: white;
                }

                .btn-export:hover, .btn-certificate:hover, .btn-preview:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
                }

                .btn-export:disabled, .btn-certificate:disabled, .btn-preview:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                @media (max-width: 600px) {
                    .modal-header, .modal-content, .modal-footer {
                        padding-left: 1.25rem;
                        padding-right: 1.25rem;
                    }

                    .modal-footer {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
}
