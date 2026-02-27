"use client";
import React from 'react';
import { PenTool, Sparkles, Wand2 } from 'lucide-react';

export default function TextGenPage() {
  return (
    <div className="h-full w-full p-6 text-slate-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <div>
                 <h1 className="text-2xl font-bold text-white">文生文 (Text Generation)</h1>
                 <p className="text-sm text-slate-400">SEO Articles, Social Media Posts, and Marketing Copy.</p>
            </div>
             <button className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Wand2 size={16} /> 开始创作
            </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <div className="text-center text-slate-500">
                <PenTool size={48} className="mx-auto mb-4 opacity-50" />
                <p>AI Writing Studio</p>
                <p className="text-xs mt-2">Connecting to GPT-4 / Claude models...</p>
            </div>
        </div>
    </div>
  )
}
