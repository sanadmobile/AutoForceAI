"use client";
import React from 'react';
import { Share2, Globe } from 'lucide-react';

export default function DistributionPage() {
  return (
    <div className="h-full w-full p-6 text-slate-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <div>
                 <h1 className="text-2xl font-bold text-white">内容投放 (Content Distribution)</h1>
                 <p className="text-sm text-slate-400">Multi-channel publishing engine.</p>
            </div>
             <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Share2 size={16} /> 新建计划
            </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <div className="text-center text-slate-500">
                <Globe size={48} className="mx-auto mb-4 opacity-50" />
                <p>Distribution Matrix</p>
                <p className="text-xs mt-2">Connecting to WeChat / TikTok / Twitter APIs...</p>
            </div>
        </div>
    </div>
  )
}
