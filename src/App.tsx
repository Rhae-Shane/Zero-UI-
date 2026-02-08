import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Command } from 'lucide-react';
import { processIntent, type UIInstruction } from './lib/tambo';

// Primitives
import { GenerativeTable } from './components/generative/GenerativeTable';
import { GenerativeChart } from './components/generative/GenerativeChart';
import { GenerativeKPI } from './components/generative/GenerativeKPI';
import { GenerativeForm } from './components/generative/GenerativeForm';
import { ActionGuard } from './components/generative/ActionGuard';

// UI
import { clsx } from 'clsx';

interface Message {
  role: 'user' | 'system';
  content: string;
  ui?: UIInstruction[];
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'Zero-UI Admin initialized. Standing by for intent.' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Action Guard State (Global for MVP simplicity)
  const [guardState, setGuardState] = useState<{ isOpen: boolean, props?: any }>({ isOpen: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userText = input;
    setInput('');
    setIsProcessing(true);

    // 1. Add User Message
    setMessages(prev => [...prev, { role: 'user', content: userText }]);

    // 2. Process Intent (Tambo SDK / Fail-Safe)
    try {
      const instructions = await processIntent(userText);
      const systemMsg = instructions[0]?.message || 'Start rendering...';

      // 3. Handle Special "Guard" Instructions Interception
      const guardInstruction = instructions.find(i => i.component === 'ActionGuard');
      if (guardInstruction) {
        setGuardState({ isOpen: true, props: guardInstruction.props });
        setMessages(prev => [...prev, { role: 'system', content: systemMsg }]); // Just show text
      } else {
        // Normal Rendering
        setMessages(prev => [...prev, { role: 'system', content: systemMsg, ui: instructions }]);
      }

    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', content: 'Error processing intent. Try again.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);


  // --- RENDER ENGINE ---
  const renderComponent = (instruction: UIInstruction) => {
    const { component, props, id } = instruction;

    switch (component) {
      case 'GenerativeTable':
        return <GenerativeTable key={id} {...props} />;
      case 'GenerativeChart':
        return <GenerativeChart key={id} {...props} />;
      case 'GenerativeKPI':
        return <GenerativeKPI key={id} {...props} />;
      case 'GenerativeForm':
        return <GenerativeForm key={id} {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[128px]" />
      </div>

      <div className="max-w-5xl mx-auto flex flex-col h-screen relative z-10">

        {/* Header (Minimal) */}
        <header className="p-6 flex items-center gap-3 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
            <Command size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white/90">Zero-UI Admin</h1>
          <div className="ml-auto flex gap-2">
            <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-white/50 border border-white/5">
              Tambo SDK: Connected
            </span>
          </div>
        </header>

        {/* Dynamic Canvas (Chat + Generative UI) */}
        <main className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth pb-32">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={clsx(
                "flex gap-4 max-w-4xl mx-auto",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'system' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mt-1 flex-shrink-0">
                  <Sparkles size={14} className="text-white" />
                </div>
              )}

              <div className={clsx(
                "flex flex-col gap-4 max-w-[85%]",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                {/* Text Bubble */}
                <div className={clsx(
                  "px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'user'
                    ? "bg-white text-slate-900 font-medium rounded-tr-none"
                    : "bg-white/5 border border-white/10 text-white/80 rounded-tl-none backdrop-blur-sm"
                )}>
                  {msg.content}
                </div>

                {/* Generative UI Output */}
                {msg.ui && (
                  <div className="w-full space-y-4 animate-in fade-in duration-500 slide-in-from-bottom-2">
                    {msg.ui.map(instruction => (
                      <div key={instruction.id} className="w-full">
                        {renderComponent(instruction)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-4 max-w-4xl mx-auto">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                <Bot size={16} className="text-white/30" />
              </div>
              <div className="flex items-center gap-1 h-8">
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce delay-0" />
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </main>

        {/* Command Bar */}
        <div className="p-6 sticky bottom-0 z-20 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
            <form
              onSubmit={handleSubmit}
              className="relative bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-xl flex items-center shadow-2xl"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Tambo to show leads, analyze data, or execute actions..."
                className="flex-1 bg-transparent border-none text-white placeholder-white/30 px-6 py-4 focus:ring-0 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="p-3 mr-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Bot size={20} className="animate-pulse" /> : <Send size={20} />}
              </button>
            </form>
            <div className="text-center mt-3">
              <p className="text-[10px] text-white/20 uppercase tracking-widest font-semibold">
                Powered by Tambo Generative SDK
              </p>
            </div>
          </div>
        </div>

        {/* AI Action Guard Modal */}
        <ActionGuard
          isOpen={guardState.isOpen}
          title={guardState.props?.title || ''}
          description={guardState.props?.description || ''}
          impactMetrics={guardState.props?.impactMetrics || []}
          onConfirm={() => {
            setGuardState({ isOpen: false });
            setMessages(prev => [...prev, {
              role: 'system',
              content: 'Action confirmed. Execution logic would run here.'
            }]);
          }}
          onCancel={() => {
            setGuardState({ isOpen: false });
            setMessages(prev => [...prev, {
              role: 'system',
              content: 'Action cancelled by user.'
            }]);
          }}
        />

      </div>
    </div>
  );
}

export default App;
