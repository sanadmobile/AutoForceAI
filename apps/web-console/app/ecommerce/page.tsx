"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
    ShoppingBag, 
    TrendingUp, 
    Users, 
    MessageSquare, 
    Package, 
    ArrowUpRight, 
    Sparkles, 
    Search,
    Brain,
    Bot,
    ExternalLink
} from 'lucide-react';

const MOCK_STATS = [
    { label: "今日 GMV", value: "¥128,490", trend: "+12.5%", color: "text-emerald-400" },
    { label: "转化率 (CVR)", value: "4.8%", trend: "+0.3%", color: "text-indigo-400" },
    { label: "AI 导购接待", value: "845 人", trend: "+122", color: "text-pink-400" },
];

const RECENT_ORDERS = [
    { id: "ORD-2819", product: "午夜丝绒·露背晚礼服", amount: "¥1,299", status: "Paid", time: "2 mins ago" },
    { id: "ORD-2818", product: "极简主义·桑蚕丝衬衫", amount: "¥299", status: "Paid", time: "5 mins ago" },
    { id: "ORD-2817", product: "Classic Tweed Jacket", amount: "¥899", status: "Pending", time: "12 mins ago" },
];

const AGENT_LOGS = [
    { id: 1, user: "User_992", intent: "Size Inquiry", agent_reply: "Recommended Size S based on history...", sentiment: "Positive" },
    { id: 2, user: "User_881", intent: "Style Advice", agent_reply: "Suggested matching accessories...", sentiment: "Neutral" },
    { id: 3, user: "User_773", intent: "Return Policy", agent_reply: "Explained 7-day no-reason return...", sentiment: "Positive" },
];

export default function EcommerceDashboard() {
  return (
    <div className="space-y-8">
      {/* Dashboard Actions */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
             运营数据
          </h2>
          <p className="text-slate-500 text-xs">
             实时数据更新于: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3">
            <Link 
                href="http://localhost:3001" 
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm font-bold"
            >
                <ExternalLink size={16} /> 前往商城前台
            </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_STATS.map((stat, i) => (
            <div key={i} className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{stat.label}</p>
                <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-white font-mono">{stat.value}</span>
                    <span className={`text-xs ${stat.color}`}>{stat.trend}</span>
                </div>
            </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Orders */}
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 h-full">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <Package size={18} className="text-blue-400"/> 实时订单
                      </h3>
                      <button className="text-xs text-indigo-400 hover:text-indigo-300">View All</button>
                  </div>
                  <div className="space-y-4">
                      {RECENT_ORDERS.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-colors">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-slate-500 font-serif">
                                      {order.product[0]}
                                  </div>
                                  <div>
                                      <p className="text-sm font-medium text-white">{order.product}</p>
                                      <p className="text-xs text-slate-500 font-mono">{order.id} • {order.time}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-sm font-bold text-white">{order.amount}</p>
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                                      {order.status}
                                  </span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Agent Status */}
          <div className="space-y-6">
              <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-[50px] rounded-full"></div>
                  
                  <div className="flex justify-between items-center mb-6 relative z-10">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <Bot size={18} className="text-pink-400"/> Sophie 状态
                      </h3>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                  </div>

                  <div className="space-y-4 relative z-10">
                      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                          <div className="text-xs text-indigo-300 uppercase tracking-widest mb-1">当前任务</div>
                          <div className="text-sm text-white font-medium">分析 2026早春流行趋势...</div>
                          <div className="w-full bg-indigo-900/50 h-1 mt-3 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full w-[70%] animate-pulse"></div>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <p className="text-xs text-slate-400 uppercase tracking-widest pl-1">最近对话</p>
                          {AGENT_LOGS.map(log => (
                              <div key={log.id} className="text-xs p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                  <div className="flex justify-between mb-1">
                                      <span className="text-slate-300 font-bold">{log.user}</span>
                                      <span className="text-[10px] text-slate-500">{log.intent}</span>
                                  </div>
                                  <p className="text-slate-400 line-clamp-1 italic">"{log.agent_reply}"</p>
                              </div>
                          ))}
                      </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
                       <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-colors flex items-center justify-center gap-2">
                           <Brain size={14} /> 调整 Sophie 提示词
                       </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
