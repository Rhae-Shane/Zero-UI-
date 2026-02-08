import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionGuardProps {
    isOpen: boolean;
    title: string;
    description: string;
    impactMetrics: string[]; // e.g. ["3 Users affected", "12 Leads archived"]
    onConfirm: () => void;
    onCancel: () => void;
}

export function ActionGuard({
    isOpen,
    title,
    description,
    impactMetrics,
    onConfirm,
    onCancel
}: ActionGuardProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onCancel}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-red-500/30 w-full max-w-lg rounded-2xl shadow-2xl shadow-red-900/20 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-red-500/10 p-6 border-b border-red-500/20 flex items-start gap-4">
                        <div className="p-3 bg-red-500/20 rounded-full text-red-400">
                            <ShieldAlert size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">AI Safety Check</h3>
                            <p className="text-red-200/80 text-sm">Destructive action interception</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8">
                        <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
                        <p className="text-white/60 mb-6 leading-relaxed">
                            {description}
                        </p>

                        {/* Impact Analysis */}
                        <div className="bg-white/5 rounded-lg p-4 mb-8">
                            <span className="text-xs uppercase text-white/40 font-bold tracking-wider mb-3 block">
                                Projected Impact
                            </span>
                            <ul className="space-y-2">
                                {impactMetrics.map((metric, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-white/80 font-mono text-sm">
                                        <AlertTriangle size={14} className="text-yellow-500" />
                                        {metric}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onCancel}
                                className="px-5 py-2.5 text-white/70 hover:text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-lg shadow-red-600/20 transition-all active:scale-95"
                            >
                                Confirm Execution
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
