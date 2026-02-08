import { create } from 'zustand';
import type { UIInstruction } from '../lib/tambo';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content?: string;
    uiInstructions?: UIInstruction[];
    timestamp: number;
}

// Simplified schema for AI context
export interface TableSchema {
    name: string;
    columns: string[];
}

export type ProviderType = 'supabase' | 'zoho';

export interface Connection {
    isConnected: boolean;
    provider: ProviderType;

    // Common
    openaiKey: string;
    schema?: TableSchema[];
    businessContext?: string; // User's description of their data
    onboardingComplete: boolean; // Has user described their data?

    // Supabase Specific
    supabaseUrl?: string;
    supabaseKey?: string;

    // Zoho Specific
    zohoAccessToken?: string;
    zohoApiDomain?: string; // e.g. www.zoho.com, www.zoho.eu
}

interface ChatStore {
    messages: Message[];
    isProcessing: boolean;
    connection: Connection;
    addMessage: (msg: Message) => void;
    setProcessing: (status: boolean) => void;

    // Unified Connect Action
    connectSupabase: (url: string, key: string, openaiKey: string, schema?: TableSchema[]) => void;
    connectZoho: (accessToken: string, apiDomain: string, openaiKey: string, schema?: TableSchema[]) => void;

    disconnect: () => void;
    clearChat: () => void;
    setBusinessContext: (context: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    messages: [{
        id: 'init',
        role: 'ai',
        content: 'Welcome to Zero-UI Admin. Connect a data source to begin.',
        timestamp: Date.now()
    }],
    isProcessing: false,
    connection: {
        isConnected: false,
        provider: 'supabase', // Default
        openaiKey: '',
        schema: [],
        onboardingComplete: false
    },
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setProcessing: (status) => set({ isProcessing: status }),

    connectSupabase: (url, key, openaiKey, schema) => set({
        connection: {
            isConnected: true,
            provider: 'supabase',
            supabaseUrl: url,
            supabaseKey: key,
            openaiKey,
            schema,
            onboardingComplete: false
        },
        messages: [{
            id: `sys-${Date.now()}`,
            role: 'ai',
            content: `Connected to Supabase! I found these tables: **${(schema || []).map(t => t.name).join(', ')}**. Tell me about your data - what does each table represent?`,
            timestamp: Date.now()
        }]
    }),

    connectZoho: (accessToken, apiDomain, openaiKey, schema) => set({
        connection: {
            isConnected: true,
            provider: 'zoho',
            zohoAccessToken: accessToken,
            zohoApiDomain: apiDomain,
            openaiKey,
            schema,
            onboardingComplete: false
        },
        messages: [{
            id: `sys-${Date.now()}`,
            role: 'ai',
            content: `Connected to Zoho CRM! I found these modules: **${(schema || []).map(t => t.name).join(', ')}**. Tell me about your CRM data - what do you track in each module?`,
            timestamp: Date.now()
        }]
    }),

    disconnect: () => set({
        connection: { isConnected: false, provider: 'supabase', openaiKey: '', schema: [], onboardingComplete: false },
        messages: [{
            id: `sys-${Date.now()}`,
            role: 'ai',
            content: 'Disconnected. Please connect a database to continue.',
            timestamp: Date.now()
        }]
    }),
    clearChat: () => set({ messages: [] }),
    setBusinessContext: (context) => set((state) => ({
        connection: { ...state.connection, businessContext: context, onboardingComplete: true }
    }))
}));
