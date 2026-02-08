import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useChatStore } from './store/chatStore';
import { classifyIntent } from './lib/openai';
import { processIntent } from './lib/adapters/SupabaseAdapter';
import { determineUI } from './lib/tambo';
import { GenerativeTable } from './components/generative/GenerativeTable';
import { GenerativeChart } from './components/generative/GenerativeChart';
import { GenerativeKPI } from './components/generative/GenerativeKPI';
import { GenerativeInsight } from './components/generative/GenerativeInsight';
// @ts-ignore
import { ConnectionModal } from './components/ConnectionModal';
import { Database, Plug } from 'lucide-react';

function App() {
  const { messages, addMessage, isProcessing, setProcessing, connection } = useChatStore();
  const [input, setInput] = useState('');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    if (!connection.isConnected) {
      setIsConnectModalOpen(true);
      return;
    }

    const userMsg = input.trim();
    setInput('');
    addMessage({ id: Date.now().toString(), role: 'user', content: userMsg, timestamp: Date.now() });
    setProcessing(true);

    try {
      // ONBOARDING: If this is the first message after connect, save as business context
      if (!connection.onboardingComplete) {
        const { setBusinessContext } = useChatStore.getState();
        setBusinessContext(userMsg);

        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: `Got it! I'll remember that context. Now you can ask me anything about your data. Try: "Count of ${connection.schema?.[0]?.name || 'records'}" or "List recent ${connection.schema?.[0]?.name || 'items'}"`,
          timestamp: Date.now()
        });
        setProcessing(false);
        return;
      }

      // 1. Understand Intent (with business context)
      const intent = await classifyIntent(userMsg, connection.openaiKey, connection.schema, connection.businessContext);
      console.log("Intent:", intent);

      // 2. Fetch Data
      let data;
      if (connection.provider === 'zoho') {
        // Dynamic Import to avoid circular deps or heavy loads if not used? No, static is fine for now.
        // actually we need to import it.
        const { processZohoIntent } = await import('./lib/adapters/ZohoAdapter');
        data = await processZohoIntent(intent, connection);
      } else {
        data = await processIntent(intent, connection);
      }
      console.log("Data:", data);

      // 3. Generate UI Instructions
      const instructions = await determineUI(intent, data, connection.openaiKey);
      console.log("UI:", instructions);

      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'ai',
        uiInstructions: instructions,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error(error);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'ai',
        uiInstructions: [{
          id: 'err',
          component: 'GenerativeInsight',
          props: {
            title: "I couldn't process that request",
            content: error.message || "Unknown error occurred",
            severity: "warning"
          }
        }],
        timestamp: Date.now()
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderComponent = (instruction: any) => {
    const { component, props, id } = instruction;
    switch (component) {
      case 'GenerativeTable': return <GenerativeTable key={id} {...props} />;
      case 'GenerativeChart': return <GenerativeChart key={id} {...props} />;
      case 'GenerativeKPI': return <GenerativeKPI key={id} {...props} />;
      case 'GenerativeInsight': return <GenerativeInsight key={id} {...props} />;
      default: return <div key={id} className="text-red-500">Unknown Component: {component}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto flex flex-col h-screen">

        {/* Header */}
        <header className="p-6 border-b border-white/5 flex items-center justify-between bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Sparkles className="text-indigo-400" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">Zero-UI Admin</h1>
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">AI Native • Phase 2</p>
            </div>
          </div>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${connection.isConnected
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
              }`}
          >
            {connection.isConnected ? <Plug size={14} /> : <Database size={14} />}
            {connection.isConnected
              ? (
                <span>
                  Connected: <span className="opacity-75">
                    {connection.provider === 'supabase'
                      ? (connection.supabaseUrl?.split('.')[0].replace('https://', '') || 'Supabase')
                      : (connection.zohoApiDomain || 'Zoho CRM')}
                  </span>
                </span>
              )
              : 'Connect DB'
            }
          </button>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

              {/* Message Bubble (Text) */}
              {msg.content && (
                <div className={`max-w-[80%] px-5 py-3 rounded-2xl mb-2 text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white/10 text-neutral-200 rounded-bl-none'
                  }`}>
                  {msg.content}
                </div>
              )}

              {/* Generative UI Container */}
              {msg.uiInstructions && (
                <div className="w-full max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {msg.uiInstructions.map(renderComponent)}
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-neutral-500 text-sm pl-4 animate-pulse">
              <Loader2 className="animate-spin" size={16} />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        {/* Input Area */}
        <div className="p-6 border-t border-white/5 bg-neutral-950/50 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={connection.isConnected ? "Ask about your data..." : "Connect a database to start..."}
              disabled={!connection.isConnected}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all placeholder:text-neutral-600 text-neutral-200 shadow-xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
            <button
              type="submit"
              disabled={isProcessing || !input.trim() || !connection.isConnected}
              className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        <ConnectionModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;
