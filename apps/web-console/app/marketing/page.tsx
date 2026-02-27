"use client";
import React from 'react';
import { 
  BarChart, 
  PenTool, 
  Image as ImageIcon, 
  Send, 
  Cpu, 
  TrendingUp,
  ArrowUpRight,
  MousePointerClick,
  Eye,
  Share2
} from 'lucide-react';
import Link from 'next/link';

export default function MarketingDashboard() {
  return (
    <div className="h-full w-full p-6 text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-rose-400">AI 营销云看板</h1>
        <p className="text-sm text-slate-400 mt-1">AIGC Content Creation & Automated Marketing Operations</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard icon={Eye} title="总曝光量 (Impressions)" value="2.4M" trend="+18.2%" trendUp />
          <KpiCard icon={MousePointerClick} title="互动点击 (Clicks)" value="45.2k" trend="+5.4%" trendUp />
          <KpiCard icon={Share2} title="内容分发 (Posts)" value="128" sub="This Week" />
          <KpiCard icon={Cpu} title="RPA 任务执行" value="89%" trend="Success Rate" trendUp={true} />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          
          {/* Content Creation Hub */}
          <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-semibold flex items-center gap-2 mb-6">
                  <PenTool size={18} className="text-orange-400" />
                  内容生产中心 (AIGC Hub)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                  <ActionCard 
                    href="/marketing/text-gen"
                    title="文生文 (Text Gen)"
                    desc="生成 SEO 文章、社媒文案、营销邮件。"
                    icon={PenTool}
                    color="bg-orange-500"
                  />
                  <ActionCard 
                    href="/marketing/image-gen"
                    title="文生图 (Image Gen)"
                    desc="生成海报、配图、产品展示图。"
                    icon={ImageIcon}
                    color="bg-pink-500"
                  />
              </div>
          </div>

          {/* Operations Hub */}
          <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-semibold flex items-center gap-2 mb-6">
                  <Send size={18} className="text-blue-400" />
                  自动化运营 (Ops Automation)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                  <ActionCard 
                    href="/marketing/distribution"
                    title="一键投放 (Distribute)"
                    desc="多平台内容同步 (微信/知乎/小红书)。"
                    icon={Share2}
                    color="bg-blue-500"
                  />
                  <ActionCard 
                    href="/marketing/rpa"
                    title="RPA 执行 (RPA Worker)"
                    desc="自动点赞评论、私信触达、数据采集。"
                    icon={Cpu}
                    color="bg-cyan-500"
                  />
              </div>
          </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, trend, trendUp, sub, color }: any) {
    return (
        <div className="glass-panel p-5 flex flex-col justify-between relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color || 'text-white'}`}>
                <Icon size={60} />
            </div>
            <div className="flex items-center gap-3 mb-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <Icon size={16} />
                {title}
            </div>
            <div className="flex items-end gap-3 z-10">
                <span className={`text-3xl font-bold text-white tracking-tight`}>{value}</span>
                {trend && (
                    <span className={`text-xs font-bold mb-1.5 px-1.5 py-0.5 rounded ${trendUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {trend}
                    </span>
                )}
                {sub && <span className="text-xs text-slate-500 mb-1.5">{sub}</span>}
            </div>
        </div>
    )
}

function ActionCard({ href, title, desc, icon: Icon, color }: any) {
    return (
        <Link href={href} className="flex flex-col p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all hover:-translate-y-1 group">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white mb-3 shadow-lg`}>
                <Icon size={20} />
            </div>
            <h4 className="font-bold text-slate-200 mb-1 text-sm">{title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            <div className="mt-3 flex justify-end">
                <ArrowUpRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
            </div>
        </Link>
    )
}
