import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface ChartProps {
    title: string;
    type: 'line' | 'bar' | 'pie';
    data: any[];
    xKey?: string;
    yKey?: string; // For line/bar
    dataKey?: string; // For pie
    color?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function GenerativeChart({ title, type, data, xKey = 'name', yKey = 'value', dataKey = 'value', color = '#8884d8' }: ChartProps) {
    return (
        <div className="w-full h-[400px] bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 animate-in fade-in zoom-in duration-500">
            <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
            <ResponsiveContainer width="100%" height="90%">
                {renderChart(type, data, xKey, yKey, dataKey, color)}
            </ResponsiveContainer>
        </div>
    );
}

function renderChart(type: string, data: any[], xKey: string, yKey: string, dataKey: string, color: string) {
    switch (type) {
        case 'line':
            return (
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey={xKey} stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={3} dot={{ fill: color, strokeWidth: 2 }} role="img" />
                </LineChart>
            );
        case 'bar':
            return (
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey={xKey} stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} role="img" />
                </BarChart>
            );
        case 'pie':
            return (
                <PieChart>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey={dataKey}
                    >
                        {data.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            );
        default:
            return <div className="text-white/50">Unsupported chart type</div>;
    }
}
