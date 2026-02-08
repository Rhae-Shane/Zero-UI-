import type { Intent } from '../openai';
import type { Connection } from '../../store/chatStore';

export async function fetchZohoSchema(connection: Connection) {
    // Fetch Modules from Zoho CRM API via proxy
    const { zohoAccessToken } = connection;

    try {
        // Use the proxy path instead of direct Zoho URL
        const url = `/api/zoho/settings/modules`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${zohoAccessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Zoho API Error: ${response.statusText}`);
        }

        const data = await response.json();

        return data.modules.map((m: any) => ({
            name: m.api_name,
            columns: ['id', 'Created_Time', 'Modified_Time', 'Owner']
        }));

    } catch (error) {
        console.error("Zoho Schema Fetch Error:", error);
        // Fallback for demo
        return [
            { name: 'Leads', columns: ['Last_Name', 'Company', 'Email', 'Annual_Revenue'] },
            { name: 'Deals', columns: ['Deal_Name', 'Amount', 'Stage', 'Closing_Date'] },
            { name: 'Contacts', columns: ['Last_Name', 'Account_Name', 'Email', 'Phone'] }
        ];
    }
}

export async function processZohoIntent(intent: Intent, connection: Connection) {
    console.log("Processing Zoho Intent:", intent);
    const { zohoAccessToken } = connection;

    switch (intent.type) {
        case 'VIEW_LIST':
            return await handleZohoList(intent, zohoAccessToken!);
        case 'ANALYZE_METRIC':
            return await handleZohoMetric(intent, zohoAccessToken!);
        case 'COMPARE_METRIC':
            return await handleZohoComparison(intent, zohoAccessToken!);
        default:
            throw new Error(`Unknown intent type: ${intent.type}`);
    }
}

async function handleZohoList(intent: Intent, token: string) {
    const { entity } = intent;

    const query = `
        SELECT Last_Name, id, Created_Time 
        FROM ${entity} 
        ORDER BY Created_Time DESC 
        LIMIT 10
    `;

    // Use proxy path
    const url = `/api/zoho/coql`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ select_query: query })
    });

    const data = await response.json();

    return {
        type: 'list',
        entity,
        data: data.data || []
    };
}

async function handleZohoMetric(intent: Intent, token: string) {
    const { entity, metric } = intent;

    let query = '';
    if (metric === 'count') {
        query = `SELECT COUNT(id) FROM ${entity}`;
    } else if (metric === 'sum' || metric === 'revenue') {
        const field = entity === 'Deals' ? 'Amount' : 'Annual_Revenue';
        query = `SELECT SUM(${field}) FROM ${entity}`;
    } else {
        query = `SELECT COUNT(id) FROM ${entity}`;
    }

    // Use proxy path
    const url = `/api/zoho/coql`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ select_query: query })
    });

    const data = await response.json();

    const row = data.data?.[0] || {};
    const value = Object.values(row)[0] || 0;

    return {
        type: 'metric',
        label: `Total ${metric} for ${entity}`,
        value,
        trend: 0,
        trendLabel: 'vs last period',
        context: 'neutral'
    };
}

async function handleZohoComparison(intent: Intent, token: string) {
    const { entity, metric } = intent;

    let groupBy = '';
    let agg = '';

    if (entity === 'Deals') {
        groupBy = 'Stage';
        agg = 'SUM(Amount)';
    } else if (entity === 'Leads') {
        groupBy = 'Lead_Source';
        agg = 'COUNT(id)';
    } else {
        groupBy = 'Owner';
        agg = 'COUNT(id)';
    }

    const query = `SELECT ${groupBy}, ${agg} FROM ${entity} GROUP BY ${groupBy}`;

    // Use proxy path
    const url = `/api/zoho/coql`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ select_query: query })
    });

    const data = await response.json();

    const chartData = (data.data || []).map((row: any) => ({
        name: row[groupBy],
        value: Object.values(row).find(v => typeof v === 'number') || 0
    }));

    return {
        type: 'comparison',
        title: `${metric} by ${groupBy}`,
        data: chartData,
        xKey: 'name',
        yKey: 'value'
    };
}
