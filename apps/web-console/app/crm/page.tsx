"use client";
import React from 'react';
import { Briefcase, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CrmPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
      <div className="bg-rose-500/10 p-6 rounded-full border border-rose-500/20 mb-6 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
        <Briefcase size={48} className="text-rose-400" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">AI 客户关系管理 CRM</h1>
      <p className="text-slate-400 max-w-md mb-8">
        Intelligent CRM System is under construction.<br/>
        全渠道客户画像与自动化销售线索挖掘引擎。
      </p>
      <Link href="/" className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors">
         <ArrowLeft size={16} /> 返回门户
      </Link>
    </div>
  );
}
