import { useState } from 'react';
import { Database, Link, AlertCircle, Loader2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { createClient } from '@supabase/supabase-js';
import { fetchSchema } from '../lib/adapters/SupabaseAdapter';

interface ConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ConnectionModal({ isOpen, onClose }: ConnectionModalProps) {
    const { setConnection } = useChatStore();
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    if (!isOpen) return null;

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsValidating(true);
        setStatusMessage('Connecting...');

        try {
            // Validate basic format
            if (!url.startsWith('https://')) throw new Error('URL must start with https://');
            if (key.length < 20) throw new Error('Invalid Supabase Key format');

            // OpenAI key is optional if .env is set, but if provided, check format
            if (openaiKey && !openaiKey.startsWith('sk-')) throw new Error('Invalid OpenAI Key format (starts with sk-...)');

            // Validate connection strictly by trying to fetch a session or just ping
            const tempClient = createClient(url, key);

            setStatusMessage('Discovering Schema...');
            const schema = await fetchSchema(tempClient);
            console.log("Discovered Schema:", schema);

            setConnection(url, key, openaiKey, schema);
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
                        <h2 className="text-xl font-bold text-white">Connect Database</h2>
                        <p className="text-sm text-neutral-400">Enter your Supabase credentials</p>
                    </div>
                </div>

                <form onSubmit={handleConnect} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 uppercase mb-1">Project URL</label>
                        <input
                            type="url"
                            required
                            placeholder="https://your-project.supabase.co"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 uppercase mb-1">Anon Public Key</label>
                        <input
                            type="password"
                            required
                            placeholder="eyJh..."
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            value={key}
                            onChange={e => setKey(e.target.value)}
                        />
                    </div>

                    <div className="pt-2 border-t border-white/5 mt-2">
                        <label className="block text-xs font-medium text-indigo-400 uppercase mb-1">OpenAI API Key (Optional)</label>
                        <input
                            type="password"
                            placeholder="sk-..."
                            className="w-full bg-black/30 border border-indigo-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            value={openaiKey}
                            onChange={e => setOpenaiKey(e.target.value)}
                        />
                        <p className="text-[10px] text-neutral-500 mt-1">Leave blank to use default system key.</p>
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
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
