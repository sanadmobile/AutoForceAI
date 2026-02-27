
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Loader2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatSidebarProps {
    bot: any;
    onClose: () => void;
}

export default function ChatSidebar({ bot, onClose }: ChatSidebarProps) {
    const { token } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Welcome Message
    useEffect(() => {
        if (bot) {
            setMessages([{
                id: "welcome",
                role: "assistant",
                content: bot.welcome_message || "Hello! How can I help you today?",
                timestamp: new Date()
            }]);
        }
    }, [bot]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
            
            // Create placeholder for partial response
            const botMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                id: botMsgId,
                role: "assistant",
                content: "",
                timestamp: new Date()
            }]);

            const response = await fetch(`${baseUrl}/api/v1/chat/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    bot_id: bot.id,
                    message: userMsg.content,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    stream: true
                })
            });

            if (!response.ok) throw new Error(response.statusText);
            
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const text = decoder.decode(value, { stream: true });
                accumulatedContent += text;
                
                setMessages(prev => prev.map(m => 
                    m.id === botMsgId ? { ...m, content: accumulatedContent } : m
                ));
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                // If we already have a specialized empty/partial message, update it with error
                // otherwise append error
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') { // Likely the one we added
                     return prev.map(m => m.id === last.id ? { ...m, content: m.content + "\n[System Error: Failed to get response]" } : m);
                }
                return [...prev, {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: "Network error.",
                    timestamp: new Date()
                }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-[#1C1F26] border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1C1F26]/95 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">{bot.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{bot.model_name}</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white shadow-lg' 
                                : 'bg-slate-800/80 text-slate-200 border border-white/5 shadow-sm'
                        }`}>
                           {msg.role === 'assistant' ? (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                           ) : (
                                <div>{msg.content}</div>
                           )}
                        </div>
                    </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800/80 rounded-lg p-3 border border-white/5">
                            <Loader2 className="animate-spin h-4 w-4 text-indigo-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-[#1C1F26]">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none h-[50px] custom-scrollbar"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
