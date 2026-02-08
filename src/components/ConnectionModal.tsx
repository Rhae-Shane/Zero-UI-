import { useState } from 'react';
import { Database, Link, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { useChatStore, type ProviderType } from '../store/chatStore';
import { createClient } from '@supabase/supabase-js';
import { fetchSchema } from '../lib/adapters/SupabaseAdapter';

interface ConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ConnectionModal({ isOpen, onClose }: ConnectionModalProps) {
    const { connectSupabase, connectZoho } = useChatStore();

    // UI Layout State
    const [activeTab, setActiveTab] = useState<ProviderType>('supabase');

    // Form States
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');

    const [zohoToken, setZohoToken] = useState('');
    const [zohoDomain, setZohoDomain] = useState('www.zoho.com');

    // Shared State
    const [openaiKey, setOpenaiKey] = useState('');
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    if (!isOpen) return null;

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsValidating(true);

        try {
            if (activeTab === 'supabase') {
                setStatusMessage('Connecting to Supabase...');
                // Validate basic format
                if (!supabaseUrl.startsWith('https://')) throw new Error('URL must start with https://');
                if (supabaseKey.length < 20) throw new Error('Invalid Supabase Key format');

                const tempClient = createClient(supabaseUrl, supabaseKey);
                setStatusMessage('Discovering Schema...');
                const schema = await fetchSchema(tempClient);

                connectSupabase(supabaseUrl, supabaseKey, openaiKey, schema);

            } else if (activeTab === 'zoho') {
                setStatusMessage('Connecting to Zoho CRM...');
                if (!zohoToken.startsWith('1000.')) throw new Error('Invalid Zoho Access Token format (usually starts with 1000.)');

                // Hardcoded Zoho CRM schema for intent classification
                const zohoSchema = [
                    { name: 'Leads', columns: ['Last_Name', 'Company', 'Email', 'Phone', 'Lead_Source', 'Annual_Revenue', 'Created_Time'] },
                    { name: 'Deals', columns: ['Deal_Name', 'Amount', 'Stage', 'Closing_Date', 'Account_Name', 'Created_Time'] },
                    { name: 'Contacts', columns: ['Last_Name', 'First_Name', 'Email', 'Phone', 'Account_Name', 'Created_Time'] },
                    { name: 'Accounts', columns: ['Account_Name', 'Website', 'Phone', 'Industry', 'Annual_Revenue', 'Created_Time'] }
                ];

                connectZoho(zohoToken, zohoDomain, openaiKey, zohoSchema);
            }

            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Connection failed');
        } finally {
            setIsValidating(false);
            setStatusMessage('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Connect Data Source</h2>
                        <p className="text-sm text-neutral-400">Select integration type</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-black/20 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setActiveTab('supabase')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'supabase' ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Database size={14} />
                        Supabase
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('zoho')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'zoho' ? 'bg-yellow-500 text-black shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Building2 size={14} />
                        Zoho CRM
                    </button>
                </div>

                <form onSubmit={handleConnect} className="space-y-4">

                    {activeTab === 'supabase' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 uppercase mb-1">Project URL</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://your-project.supabase.co"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    value={supabaseUrl}
                                    onChange={e => setSupabaseUrl(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 uppercase mb-1">Anon Public Key</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="eyJh..."
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    value={supabaseKey}
                                    onChange={e => setSupabaseKey(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'zoho' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 uppercase mb-1">Data Center (Domain)</label>
                                <select
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 appearance-none"
                                    value={zohoDomain}
                                    onChange={e => setZohoDomain(e.target.value)}
                                >
                                    <option value="www.zoho.com">zoho.com (US)</option>
                                    <option value="www.zoho.eu">zoho.eu (EU)</option>
                                    <option value="www.zoho.in">zoho.in (IN)</option>
                                    <option value="www.zoho.com.au">zoho.com.au (AU)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 uppercase mb-1">
                                    Access Token
                                    <a href="https://api-console.zoho.com/" target="_blank" rel="noreferrer" className="ml-2 text-yellow-500 hover:underline lowercase font-normal">(generate here)</a>
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="1000.xxxx..."
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                                    value={zohoToken}
                                    onChange={e => setZohoToken(e.target.value)}
                                />
                                <p className="text-[10px] text-neutral-500 mt-1">
                                    Go to API Console &gt; Self Client &gt; Generate Token. Scope: <code className="bg-white/10 px-1 rounded">ZohoCRM.modules.ALL,ZohoCRM.coql.READ</code>
                                </p>
                            </div>
                        </>
                    )}

                    <div className="pt-2 border-t border-white/5 mt-2">
                        <label className="block text-xs font-medium text-indigo-400 uppercase mb-1">OpenAI API Key (Optional)</label>
                        <input
                            type="password"
                            placeholder="sk-..."
                            className="w-full bg-black/30 border border-indigo-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            value={openaiKey}
                            onChange={e => setOpenaiKey(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isValidating}
                            className={`flex-1 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'supabase' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
                        >
                            {isValidating ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    {statusMessage || 'Verifying...'}
                                </>
                            ) : (
                                <>
                                    <Link size={18} />
                                    Connect
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
