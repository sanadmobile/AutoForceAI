"use client";
import React from 'react';
import { Cpu, Play } from 'lucide-react';

export default function RPAPage() {
  return (
    <div className="h-full w-full p-6 text-slate-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <div>
                 <h1 className="text-2xl font-bold text-white">RPA 执行 (RPA Automation)</h1>
                 <p className="text-sm text-slate-400">Automate repetitive marketing tasks.</p>
            </div>
             <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Play size={16} /> 运行任务
            </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <div className="text-center text-slate-500">
                <Cpu size={48} className="mx-auto mb-4 opacity-50" />
                <p>RPA Task Force</p>
                <p className="text-xs mt-2">Managing active worker nodes...</p>
            </div>
        </div>
    </div>
  )
}
