import { createClient } from '@supabase/supabase-js';
import type { Intent } from '../openai';
import type { Connection } from '../../store/chatStore';

interface TableSchema {
    name: string;
    columns: string[];
}

export async function processIntent(intent: Intent, connection: Connection) {
    console.log("Processing Adapter Intent:", intent);

    if (connection.provider !== 'supabase' || !connection.supabaseUrl || !connection.supabaseKey) {
        throw new Error("Invalid Supabase connection.");
    }

    // Create dynamic client 
    const client = createClient(connection.supabaseUrl, connection.supabaseKey);

    switch (intent.type) {
        case 'VIEW_LIST':
            return await handleList(intent, client);
        case 'ANALYZE_METRIC':
            return await handleMetric(intent, client);
        case 'COMPARE_METRIC':
            return await handleComparison(intent, client, connection.schema); // Pass schema
        default:
            throw new Error(`Unknown intent type: ${intent.type}`);
    }
}

async function handleList(intent: Intent, client: any) {
    const { entity, timeframe } = intent;

    let query = client.from(entity).select('*');

    if (timeframe?.includes('recent') || timeframe?.includes('last')) {
        query = query.order('created_at', { ascending: false }).limit(10);
    } else {
        query = query.limit(20);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
        type: 'list',
        entity,
        data
    };
}

async function handleMetric(intent: Intent, client: any) {
    const { entity, metric } = intent;

    // Default to count if metric is missing or weird
    const safeMetric = metric || 'count';

    if (safeMetric === 'count') {
        const { count, error } = await client
            .from(entity)
            .select('*', { count: 'exact', head: true });

        if (error) {
            // Handle table not found or other errors politely
            console.error("Supabase Metric Error:", error);
            throw new Error(`Could not fetch count for ${entity}. Details: ${error.message}`);
        }

        return {
            type: 'metric',
            label: `Total ${entity}`,
            value: count,
            trend: 0,
            trendLabel: 'vs last period',
            context: count === 0 ? 'neutral' : 'positive' // Hint: If 0, might be RLS
        };
    }

    // Fallback for sums (e.g. revenue)
    if (['sum', 'revenue', 'avg'].includes(safeMetric)) {
        // Try to find a numeric column. For 'revenue', we guess 'amount' or 'price' or 'revenue'.
        // This is a simplified "guess" logic for Phase 1.
        const { data, error } = await client.from(entity).select('*').limit(100);

        if (error) throw error;
        if (!data || data.length === 0) return { type: 'metric', label: `Total ${safeMetric}`, value: 0 };

        // Naive sum of the first numeric column found if explicit one isn't known
        const numericKey = Object.keys(data[0]).find(k => typeof data[0][k] === 'number' && k !== 'id') || 'amount';

        const total = data.reduce((acc: number, curr: any) => acc + (curr[numericKey] || 0), 0);

        return {
            type: 'metric',
            label: `Total ${safeMetric}`,
            value: total,
            trend: 5.2,
            trendLabel: 'vs last month'
        };
    }

    throw new Error(`Unsupported metric: ${metric}`);
}

async function handleComparison(intent: Intent, client: any, schema?: TableSchema[]) {
    const { entity, metric } = intent;
    // Dynamic Grouping Logic
    // If schema is present, we can try to find a categorical column to group by if not specified.
    // For "Revenue by plan", entity=subscriptions, metric=revenue. 
    // We need to find "plan".

    // Simple heuristic: Find a text column that has few unique values (low cardinality), or use 'status', 'plan', 'category'.
    const tableSchema = schema?.find(t => t.name === entity);
    let groupColumn = 'created_at'; // Default to time-based

    if (tableSchema) {
        // Look for common grouping columns
        const candidates = ['plan', 'status', 'category', 'type', 'tier'];
        groupColumn = candidates.find(c => tableSchema.columns.includes(c)) || 'created_at';
    }

    // specific override for "Revenue by plan" style queries if the user input implies it
    // For now, let's just group by the best candidate found.

    const { data, error } = await client.from(entity).select('*');
    if (error) throw error;

    if (!data || data.length === 0) {
        return {
            type: 'comparison',
            data: []
        };
    }

    // Client-side aggregation (since we can't easily do dynamic SQL GROUP BY via standard client without RPC)
    const aggregated: Record<string, number> = {};

    data.forEach((row: any) => {
        const key = row[groupColumn] || 'Unknown';

        // Determine value to sum
        let value = 1; // Default to count
        if (['revenue', 'sum', 'amount'].includes(metric || '')) {
            const numericKey = Object.keys(row).find(k => typeof row[k] === 'number' && k !== 'id') || 'amount';
            value = row[numericKey] || 0;
        }

        aggregated[key] = (aggregated[key] || 0) + value;
    });

    const chartData = Object.keys(aggregated).map(key => ({
        name: key,
        value: aggregated[key]
    }));

    return {
        type: 'comparison',
        title: `${metric || 'Count'} by ${groupColumn}`, // Dynamic title
        data: chartData,
        xKey: 'name',
        yKey: 'value'
    };
}

export async function fetchSchema(client: any) {
    try {
        // Method 1: Swagger / OpenAPI Spec (Best for "Zero Config")
        // Supabase exposes a swagger definition at the root of the REST API.
        const restUrl = `${client.supabaseUrl}/rest/v1/?apikey=${client.supabaseKey}`;
        const response = await fetch(restUrl);

        if (response.ok) {
            const swagger = await response.json();
            return Object.keys(swagger.definitions).map(def => ({
                name: def,
                columns: Object.keys(swagger.definitions[def].properties)
            }));
        }
    } catch (e) {
        console.warn("Schema fetch via Swagger failed:", e);
    }

    // Method 2: Probe for common tables (Fallback)
    // If Swagger fails (e.g., CORS or disabled), try to select 1 row from known tables to get columns.
    const knownTables = ['users', 'orders', 'subscriptions', 'products', 'customers', 'trades', 'payments'];
    const discoveredSchema: TableSchema[] = [];

    for (const tableName of knownTables) {
        try {
            const { data, error } = await client.from(tableName).select('*').limit(1);
            if (!error) {
                // Even if empty, if no error, the table exists. 
                // If we have data, we get columns. If not, we assume standard columns or empty.
                const columns = (data && data.length > 0) ? Object.keys(data[0]) : [];
                discoveredSchema.push({ name: tableName, columns });
            }
        } catch (ignore) { }
    }

    if (discoveredSchema.length > 0) return discoveredSchema;

    // Last Resort: Return hardcoded basic schema to prevent UI crashes
    return [
        { name: 'users', columns: ['id', 'email', 'status', 'created_at'] },
        { name: 'orders', columns: ['id', 'user_id', 'amount', 'status', 'created_at'] },
        { name: 'subscriptions', columns: ['id', 'user_id', 'plan', 'revenue', 'created_at'] }
    ];
}
