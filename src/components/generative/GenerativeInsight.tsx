import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface InsightProps {
    title: string;
    content: string;
    severity?: 'info' | 'warning' | 'success';
}

export function GenerativeInsight({ title, content, severity = 'info' }: InsightProps) {
    const styles = {
        info: "bg-blue-500/10 border-blue-500/20 text-blue-200",
        warning: "bg-amber-500/10 border-amber-500/20 text-amber-200",
        success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
    };

    const icons = {
        info: <Info size={20} className="text-blue-400" />,
        warning: <AlertTriangle size={20} className="text-amber-400" />,
        success: <CheckCircle size={20} className="text-emerald-400" />
    };

    return (
        <div className={`p-4 rounded-xl border flex gap-4 items-start animate-in fade-in slide-in-from-left-4 duration-300 ${styles[severity]}`}>
            <div className="mt-0.5 shrink-0">{icons[severity]}</div>
            <div>
                <h4 className="font-medium text-sm mb-1 opacity-90">{title}</h4>
                <p className="text-sm opacity-75 leading-relaxed">{content}</p>
            </div>
        </div>
    );
}
