import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { request } from '../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const ChatWidget: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await request<{ reply: string }>(`/api/llm/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: text, project_id: id || null })
      });

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: response.reply || 'No response provided.',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant-error`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 genie-fab flex items-center justify-center"
        aria-label="Open chat"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[90vw] genie-chat-panel flex flex-col">
          <div className="px-4 py-3 border-b border-green-500/30 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-green-400">Marketing Assistant</div>
              <div className="text-xs text-green-400/70">Context-aware campaign help</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="genie-icon-button"
              aria-label="Close chat"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto bg-black">
            {messages.length === 0 && (
              <div className="text-sm text-green-400/70">
                {'>'} Ask about your campaign: “Write 3 subject lines” or “Refine the hook for this audience.”
              </div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block px-3 py-2 rounded-md max-w-[85%] border ${
                    msg.role === 'user'
                      ? 'bg-[#ccff00] text-black border-[#ccff00]/70'
                      : 'bg-transparent text-green-300 border-green-500/30'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left">
                <div className="inline-flex items-center gap-2 text-xs text-green-400/70 border border-green-500/30 px-3 py-2 rounded-md">
                  <Loader2 className="animate-spin" size={14} />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-green-500/30 bg-black">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your campaign…"
                className="flex-1 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="genie-button genie-button--primary"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
