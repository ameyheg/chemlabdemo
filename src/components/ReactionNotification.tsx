// ReactionNotification - Toast notification for reaction results

import { useEffect, useState } from 'react';
import { useLabStore } from '../store/labStore';

export function ReactionNotification() {
    const notification = useLabStore((state) => state.reactionNotification);
    const dismissNotification = useLabStore((state) => state.dismissNotification);
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        if (notification) {
            setIsVisible(true);
            setIsLeaving(false);

            // Auto-dismiss after 6 seconds
            const timer = setTimeout(() => {
                setIsLeaving(true);
                setTimeout(() => {
                    dismissNotification();
                    setIsVisible(false);
                }, 300);
            }, 6000);

            return () => clearTimeout(timer);
        }
    }, [notification, dismissNotification]);

    const handleDismiss = () => {
        setIsLeaving(true);
        setTimeout(() => {
            dismissNotification();
            setIsVisible(false);
        }, 300);
    };

    if (!notification || !isVisible) return null;

    const { reaction, products } = notification;

    // Effect icons
    const effectIcons: Record<string, string> = {
        bubbles: '🫧',
        heat: '🔥',
        color_change: '🎨',
        precipitate: '⬇️',
        smoke: '💨',
        explosion: '💥',
    };

    return (
        <div
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isLeaving ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                }`}
        >
            <div className="glass-panel p-5 max-w-md shadow-2xl border border-cyan-400/30">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-xl">
                            ⚗️
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">
                                {reaction.name}
                            </h3>
                            <p className="text-xs text-gray-400">
                                Reaction Occurred!
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                        ✕
                    </button>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                    {reaction.description}
                </p>

                {/* Products */}
                <div className="mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Products Formed:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {products.map((product) => (
                            <span
                                key={product.id}
                                className="px-3 py-1 rounded-full text-sm font-medium"
                                style={{
                                    backgroundColor: `${product.color}30`,
                                    color: product.color === '#ffffff' ? '#cccccc' : product.color,
                                    border: `1px solid ${product.color}50`,
                                }}
                            >
                                {product.formula || product.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Effects */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <span className="text-xs text-gray-400">Effects:</span>
                    <div className="flex gap-1">
                        {reaction.effects.map((effect) => (
                            <span
                                key={effect}
                                className="text-lg"
                                title={effect}
                            >
                                {effectIcons[effect] || '✨'}
                            </span>
                        ))}
                    </div>
                    {reaction.isExothermic && (
                        <span className="ml-auto text-xs text-orange-400 flex items-center gap-1">
                            <span>🌡️</span> Exothermic
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
