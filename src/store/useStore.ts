import { create } from 'zustand';
import { subDays, subMonths, format } from 'date-fns';

// --- Types ---

export interface Lead {
    id: string;
    name: string;
    company: string;
    value: number;
    status: 'New' | 'Contacted' | 'Qualified' | 'Closed' | 'Lost';
    email: string;
    lastContact: string;
}

export interface User {
    id: string;
    name: string;
    role: 'Admin' | 'Sales Rep' | 'Viewer';
    status: 'Active' | 'Inactive';
    lastActive: string;
}

export interface RevenueData {
    date: string;
    amount: number;
    category: string;
}

export interface AIAction {
    id: string;
    timestamp: string;
    description: string;
    status: 'Success' | 'Failed' | 'Pending';
}

interface ERPStore {
    leads: Lead[];
    users: User[];
    revenue: RevenueData[];
    actions: AIAction[];

    // Actions
    addLead: (lead: Omit<Lead, 'id' | 'lastContact'>) => void;
    updateLeadStatus: (id: string, status: Lead['status']) => void;
    deleteUser: (id: string) => void;
    logAction: (description: string) => void;
    resetMockData: () => void;
}

// --- Mock Data Generator ---

const generateMockLeads = (): Lead[] => [
    { id: '1', name: 'Alice Smith', company: 'TechCorp', value: 15000, status: 'New', email: 'alice@techcorp.com', lastContact: subDays(new Date(), 2).toISOString() },
    { id: '2', name: 'Bob Jones', company: 'MegaSoft', value: 8500, status: 'Contacted', email: 'bob@megasoft.com', lastContact: subDays(new Date(), 5).toISOString() },
    { id: '3', name: 'Charlie Brown', company: 'LogiStix', value: 22000, status: 'Qualified', email: 'charlie@logistix.com', lastContact: subDays(new Date(), 1).toISOString() },
    { id: '4', name: 'Diana Prince', company: 'WonderWeb', value: 45000, status: 'Closed', email: 'diana@wonderweb.com', lastContact: subMonths(new Date(), 1).toISOString() },
    { id: '5', name: 'Evan Wright', company: 'StartUp Inc', value: 5000, status: 'Lost', email: 'evan@startup.com', lastContact: subMonths(new Date(), 2).toISOString() },
];

const generateMockUsers = (): User[] => [
    { id: '1', name: 'System Admin', role: 'Admin', status: 'Active', lastActive: new Date().toISOString() },
    { id: '2', name: 'Jane Doe', role: 'Sales Rep', status: 'Active', lastActive: subDays(new Date(), 1).toISOString() },
    { id: '3', name: 'John Smith', role: 'Sales Rep', status: 'Inactive', lastActive: subMonths(new Date(), 3).toISOString() },
    { id: '4', name: 'Guest User', role: 'Viewer', status: 'Inactive', lastActive: subMonths(new Date(), 1).toISOString() },
];

const generateRevenue = (): RevenueData[] => {
    const data: RevenueData[] = [];
    for (let i = 0; i < 7; i++) {
        data.push({
            date: format(subDays(new Date(), i), 'MMM dd'),
            amount: Math.floor(Math.random() * 5000) + 2000,
            category: 'Sales',
        });
    }
    return data.reverse();
};

// --- Store Implementation ---

const useStore = create<ERPStore>((set) => ({
    leads: generateMockLeads(),
    users: generateMockUsers(),
    revenue: generateRevenue(),
    actions: [],

    addLead: (leadData) =>
        set((state) => ({
            leads: [
                ...state.leads,
                {
                    ...leadData,
                    id: Math.random().toString(36).substr(2, 9),
                    lastContact: new Date().toISOString(),
                },
            ],
        })),

    updateLeadStatus: (id, status) =>
        set((state) => ({
            leads: state.leads.map((l) => (l.id === id ? { ...l, status } : l)),
        })),

    deleteUser: (id) =>
        set((state) => ({
            users: state.users.filter((u) => u.id !== id),
        })),

    logAction: (description) =>
        set((state) => ({
            actions: [
                {
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: new Date().toISOString(),
                    description,
                    status: 'Success',
                },
                ...state.actions,
            ],
        })),

    resetMockData: () => set({
        leads: generateMockLeads(),
        users: generateMockUsers(),
        revenue: generateRevenue()
    })
}));

export default useStore;
