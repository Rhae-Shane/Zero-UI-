import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface GenerativeKPIProps {
    label: string;
    value: string | number;
    trend?: number; // percentage
    trendLabel?: string;
    context?: 'positive' | 'negative' | 'neutral';
    icon?: string;
}

export function GenerativeKPI({
    label,
    value,
    trend,
    trendLabel = "vs last month",
    context = 'positive'
}: GenerativeKPIProps) {
    const cn = (...inputs: (string | undefined)[]) => twMerge(clsx(inputs));

    const isPositive = trend && trend > 0;
    const isGood = context === 'positive' ? isPositive : !isPositive;

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg min-w-[240px] animate-in fade-in zoom-in duration-300 delay-100">
            <div className="flex justify-between items-start mb-4">
                <span className="text-white/50 text-sm font-medium uppercase tracking-wider">
                    {label}
                </span>
                <div className="p-2 bg-white/5 rounded-lg text-white/70">
                    <TrendingUp size={16} />
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                    {value}
                </h2>
            </div>

            {trend !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                    <span className={cn(
                        "flex items-center font-medium px-1.5 py-0.5 rounded",
                        isGood
                            ? "text-emerald-400 bg-emerald-400/10"
                            : "text-rose-400 bg-rose-400/10"
                    )}>
                        {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                        {Math.abs(trend)}%
                    </span>
                    <span className="text-white/30 text-xs">
                        {trendLabel}
                    </span>
                </div>
            )}
        </div>
    );
}
