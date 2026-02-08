import { useMemo } from 'react';
import useStore from '../../store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GenerativeTableProps {
    dataContext: 'leads' | 'users';
    columns?: string[];
    filter?: { key: string; value: any };
    sortBy?: string;
    title?: string;
}

export function GenerativeTable({
    dataContext,
    columns,
    filter,
    sortBy,
    title,
}: GenerativeTableProps) {
    const store = useStore();

    const rawData = useMemo(() => {
        if (dataContext === 'leads') return store.leads;
        if (dataContext === 'users') return store.users;
        return [];
    }, [store.leads, store.users, dataContext]);

    const processedData = useMemo(() => {
        let d = [...rawData];

        // 1. Filter
        if (filter) {
            d = d.filter((item: any) => {
                const itemValue = item[filter.key];
                // Simple equality check for MVP
                return String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase());
            });
        }

        // 2. Sort
        if (sortBy) {
            d.sort((a: any, b: any) => (a[sortBy] > b[sortBy] ? 1 : -1));
        }

        return d;
    }, [rawData, filter, sortBy]);

    // Auto-detect columns if not provided
    const displayColumns = columns || (processedData.length > 0 ? Object.keys(processedData[0]) : []);

    // Tailwind Helpers - fixed signature
    const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

    return (
        <div className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-xl animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white/90">
                    {title || `Data View: ${dataContext}`}
                </h3>
                <span className="text-xs text-white/40 uppercase tracking-wider">
                    {processedData.length} Records
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/70">
                    <thead className="bg-white/5 text-xs uppercase text-white/50 font-medium">
                        <tr>
                            {displayColumns.map((col) => (
                                <th key={col} className="px-6 py-3 tracking-wider">
                                    {col.replace(/([A-Z])/g, ' $1').trim()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {processedData.map((row: any, idx) => (
                            <tr
                                key={row.id || idx}
                                className="hover:bg-white/5 transition-colors duration-150 group"
                            >
                                {displayColumns.map((col) => (
                                    <td key={col} className="px-6 py-4 whitespace-nowrap">
                                        {/* Special Rendering for Status */}
                                        {col === 'status' ? (
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-xs font-medium border",
                                                row[col] === 'New' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                                row[col] === 'Contacted' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                                                row[col] === 'Qualified' && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                                                row[col] === 'Closed' && "bg-green-500/10 text-green-400 border-green-500/20",
                                                row[col] === 'Lost' && "bg-red-500/10 text-red-400 border-red-500/20",
                                                row[col] === 'Active' && "bg-green-500/10 text-green-400 border-green-500/20",
                                                row[col] === 'Inactive' && "bg-slate-500/10 text-slate-400 border-slate-500/20",
                                            )}>
                                                {row[col]}
                                            </span>
                                        ) : (
                                            <span className="group-hover:text-white transition-colors">
                                                {typeof row[col] === 'number'
                                                    ? col.toLowerCase().includes('value') || col.toLowerCase().includes('amount')
                                                        ? `$${row[col].toLocaleString()}`
                                                        : row[col]
                                                    : String(row[col])}
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {processedData.length === 0 && (
                <div className="p-8 text-center text-white/30 italic">
                    No data matches your query.
                </div>
            )}
        </div>
    );
}
