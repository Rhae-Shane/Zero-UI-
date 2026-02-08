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
interface TableSchema {
    name: string;
    columns: string[];
}

interface Connection {
    url: string;
    key: string;
    openaiKey: string;
    schema?: TableSchema[];
    isConnected: boolean;
}

interface ChatStore {
    messages: Message[];
    isProcessing: boolean;
    connection: Connection;
    addMessage: (msg: Message) => void;
    setProcessing: (status: boolean) => void;
    setConnection: (url: string, key: string, openaiKey: string, schema?: TableSchema[]) => void;
    disconnect: () => void;
    clearChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    messages: [{
        id: 'init',
        role: 'ai',
        content: 'Welcome to Zero-UI Admin. Ask me anything about your data.',
        timestamp: Date.now()
    }],
    isProcessing: false,
    connection: {
        url: '',
        key: '',
        openaiKey: '',
        schema: [],
        isConnected: false
    },
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setProcessing: (status) => set({ isProcessing: status }),
    setConnection: (url, key, openaiKey, schema) => set({
        connection: { url, key, openaiKey, schema, isConnected: true },
        messages: [{
            id: `sys-${Date.now()}`,
            role: 'ai',
            content: 'Connected to new database. Schema loaded. Ask me anything!',
            timestamp: Date.now()
        }]
    }),
    disconnect: () => set({
        connection: { url: '', key: '', openaiKey: '', isConnected: false },
        messages: [{
            id: `sys-${Date.now()}`,
            role: 'ai',
            content: 'Disconnected. Please connect a database to continue.',
            timestamp: Date.now()
        }]
    }),
    clearChat: () => set({ messages: [] })
}));
