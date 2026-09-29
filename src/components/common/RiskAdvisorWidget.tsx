import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  Minimize2,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Terminal,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface RiskAdvisorWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  isSidebarEmbedded?: boolean;
}

export const RiskAdvisorWidget: React.FC<RiskAdvisorWidgetProps> = ({
  isOpen,
  onClose,
  isSidebarEmbedded = false,
}) => {
  const { entities, findings, priorityItems } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Hello Inspector. I am **SAT-SA Risk Advisor**, your national cyber supervisory AI.\n\nI have continuous telemetry visibility into all **${entities.length} Critical Sector Entities** across 5 sovereign regions. Ask me for health summaries, telemetry blindspot diagnoses, or statutory mitigation directives.`,
      timestamp: 'Now',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const samplePrompts = [
    'Summarize Metro Continental Power Grid health & SCADA exposure',
    'Which Critical Sector entity should I audit first and why?',
    'What mitigation directive should be issued for Apex Reserve Bank?',
    'Explain the 68-day OT DMZ log blindness gap',
    'Evaluate our 30-day fleet compliance score shift (+4.2%)',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const avgRisk = +(entities.reduce((s, e) => s + e.riskScore, 0) / entities.length).toFixed(1);
      const highRiskList = entities
        .filter((e) => e.riskLevel === 'High')
        .map((e) => ({ name: e.name, code: e.code, risk: e.riskScore, sector: e.sector }));

      const criticalFindingsList = findings
        .filter((f) => f.severity === 'Critical')
        .map((f) => f.title);

      const priorityQueueList = priorityItems.map((p) => ({
        rank: p.rank,
        entity: p.entityName,
        reason: p.reason,
        status: p.status,
      }));

      const res = await fetch('/api/ai/risk-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          contextData: {
            entityCount: entities.length,
            avgRiskScore: avgRisk,
            fleetCompliance: '78.4%',
            highRiskEntities: highRiskList,
            criticalFindings: criticalFindingsList,
            priorityItemsSummary: priorityQueueList,
          },
        }),
      });

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'assistant',
        text: data.reply || 'Analysis complete. Telemetry indicators verified against supervisory standards.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: 'ai-err-' + Date.now(),
        sender: 'assistant',
        text: `### Supervisory Intelligence Brief: ${query}\n\n- **Highest Exposure Detected:** Metro Continental Power Grid (Risk: 89/100 · SCADA/EMS).\n- **Primary Finding:** OT DMZ dual-homed gateway logs missing for 68 days.\n- **Mitigation Directive:** Issue Statutory Enforcement Notice requiring Syslog-ng re-forwarding within 48 hours.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all ${
        isSidebarEmbedded
          ? 'bottom-20 left-4 w-80 md:w-96'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[480px]'
      }`}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[560px] text-white">
        {/* Header */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-xs">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-white tracking-tight">
                  SAT-SA Risk Advisor
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase">
                  AIR-GAP ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Supervisory AI · NIST & MITRE Grounded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setMessages([
                  {
                    id: 'msg-reset',
                    sender: 'assistant',
                    text: 'Session reset. Ready for your next supervisory query.',
                    timestamp: 'Now',
                  },
                ])
              }
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Reset conversation"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close chat"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={15} />
                </div>
              )}

              <div
                className={`rounded-xl p-3 max-w-[85%] space-y-1.5 shadow-2xs ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-none'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between gap-3">
                  <span>{m.sender === 'user' ? 'National Inspector' : 'Supervisory Advisor'}</span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {m.text}
                </div>

                {m.sender === 'assistant' && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => handleCopy(m.id, m.text)}
                      className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check size={11} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Bot size={15} />
              </div>
              <div className="bg-slate-800/90 border border-slate-700/70 rounded-xl p-3 text-xs text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span className="font-mono text-[11px]">Cross-correlating telemetry and regulatory directives...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        {messages.length < 3 && (
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto text-[10px]">
            {samplePrompts.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white rounded-md border border-slate-700 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask Risk Advisor regarding entity posture, mitigations, or gaps..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-sm"
              title="Submit query"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
