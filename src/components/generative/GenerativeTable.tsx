// Imports removed

// Actually, let's build standard Tailwind table without non-existent imports to be safe

export function GenerativeTable({ title, data, columns }: { title: string, data: any[], columns?: { key: string, label: string }[] }) {
    if (!data || data.length === 0) return <div className="p-4 bg-white/5 rounded-xl">No data available</div>;

    // Auto-detect columns if not provided
    const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k.toUpperCase() }));

    return (
        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-semibold text-white tracking-wide">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/70">
                    <thead className="bg-white/5 text-xs uppercase text-white/50 font-medium">
                        <tr>
                            {cols.map(c => (
                                <th key={c.key} className="px-6 py-3">{c.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                {cols.map(c => (
                                    <td key={c.key} className="px-6 py-4 font-medium text-white/90">
                                        {typeof row[c.key] === 'object' ? JSON.stringify(row[c.key]) : row[c.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
