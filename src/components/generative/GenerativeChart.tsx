import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import useStore from '../../store/useStore';

interface GenerativeChartProps {
    type: 'line' | 'bar' | 'area';
    dataKey: 'revenue' | 'leads'; // Expandable
    title?: string;
    color?: string;
}

export function GenerativeChart({
    type,
    dataKey,
    title,
    color = '#8884d8'
}: GenerativeChartProps) {
    const store = useStore();

    // Dynamic Data Selection
    const data = dataKey === 'revenue'
        ? store.revenue
        : store.leads.map(l => ({ name: l.name, value: l.value })); // Simple transformation for leads

    // Determine X-Axis key
    const xAxisKey = dataKey === 'revenue' ? 'date' : 'name';
    // Determine Data Value key
    const valKey = dataKey === 'revenue' ? 'amount' : 'value';

    const renderChart = () => {
        const CommonProps = {
            data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 }
        };

        switch (type) {
            case 'bar':
                return (
                    <BarChart {...CommonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey={xAxisKey} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey={valKey} fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                );
            case 'area':
                return (
                    <AreaChart {...CommonProps}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey={xAxisKey} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey={valKey} stroke={color} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                );
            default: // Line
                return (
                    <LineChart {...CommonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey={xAxisKey} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey={valKey} stroke={color} strokeWidth={2} dot={{ fill: color, r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                );
        }
    };

    return (
        <div className="w-full h-[300px] bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 shadow-xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-lg font-semibold text-white/90 mb-4">
                {title || `Analytics: ${dataKey.toUpperCase()}`}
            </h3>
            <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
            </ResponsiveContainer>
        </div>
    );
}
