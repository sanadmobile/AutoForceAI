"use client";
import React from 'react';
import { Image as ImageIcon, Wand2 } from 'lucide-react';

export default function ImageGenPage() {
  return (
    <div className="h-full w-full p-6 text-slate-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <div>
                 <h1 className="text-2xl font-bold text-white">文生图 (Image Generation)</h1>
                 <p className="text-sm text-slate-400">Create stunning visuals for your marketing campaigns.</p>
            </div>
             <button className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Wand2 size={16} /> 生成图片
            </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <div className="text-center text-slate-500">
                <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                <p>AI Image Studio</p>
                <p className="text-xs mt-2">Connecting to Midjourney / Stable Diffusion...</p>
            </div>
        </div>
    </div>
  )
}
