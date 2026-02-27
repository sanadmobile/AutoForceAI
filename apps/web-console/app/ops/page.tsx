"use client";
import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Server, 
  Cpu, 
  HardDrive, 
  Activity, 
  FileText, 
  Users, 
  Building2, 
  Play, 
  StopCircle, 
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

// Mock Data
const SYSTEM_STATS = [
  { label: 'CPU 使用率', value: '42%', trend: '+5%', status: 'normal', icon: Cpu, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { label: '内存占用', value: '12.8 GB', total: '32 GB', status: 'warning', icon: HardDrive, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { label: '磁盘空间', value: '234 GB', total: '1 TB', status: 'normal', icon: Server, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { label: '实时负载', value: '1.24', status: 'normal', icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
];

const QUICK_ACTIONS = [
  { label: '用户管理', href: '/ops/users', icon: Users, desc: '管理系统账号权限' },
  { label: '企业管理', href: '/ops/enterprises', icon: Building2, desc: '多租户组织架构' },
  { label: '查看日志', href: '#', icon: FileText, desc: '系统运行日志流' },
  { label: '服务重启', action: 'restart', icon: RefreshCw, desc: '重启核心服务进程' },
];

const INITIAL_LOGS = [
  { time: '10:23:45', level: 'INFO', module: 'api-gateway', message: 'Request processed in 45ms' },
  { time: '10:23:42', level: 'WARN', module: 'auth-service', message: 'Token validation slow (200ms)' },
  { time: '10:23:30', level: 'INFO', module: 'scheduler', message: 'Job "cleanup_temp_files" completed' },
  { time: '10:23:15', level: 'ERROR', module: 'connection-pool', message: 'Connection timeout: db-primary' },
  { time: '10:22:58', level: 'INFO', module: 'api-gateway', message: 'New session started: user_8821' },
];

export default function OpsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-scroll logs simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString('en-GB');
      const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
      const modules = ['api-gateway', 'scheduler', 'worker-pool', 'auth-service', 'db-shard'];
      const msgs = ['System heartbeat checked', 'Cache invalidated', 'User login attempt', 'High latency detected', 'Batch job started'];
      
      const newLog = {
        time,
        level: levels[Math.floor(Math.random() * 5)],
        module: modules[Math.floor(Math.random() * 5)],
        message: `${msgs[Math.floor(Math.random() * 5)]}. Load: ${(Math.random() * 2).toFixed(2)}`
      };
      
      setLogs(prev => [newLog, ...prev.slice(0, 8)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (action: string) => {
    if (action === 'restart') {
      setIsRefreshing(true);
      showToast("正在请求重启服务...", "info");
      setTimeout(() => {
        setIsRefreshing(false);
        showToast("服务重启指令已发送", "success");
      }, 2000);
    } else {
        showToast("功能开发中", "info");
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0B0D14] overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-white/5 bg-[#0f172a]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Terminal className="text-blue-500" />
              运维控制台
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              系统运行状态概览与快捷操作中心
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">系统运行正常</span>
             </div>
             <span className="text-slate-500 text-xs font-mono">
                v2.4.0-beta
             </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SYSTEM_STATS.map((stat, idx) => (
            <div key={idx} className={`p-5 rounded-xl border ${stat.border} ${stat.bg} relative overflow-hidden group hover:shadow-lg transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-white/5`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                {stat.status === 'warning' && <AlertTriangle size={16} className="text-yellow-400" />}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  {stat.total && <span className="text-xs text-slate-500 mb-1">/ {stat.total}</span>}
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <ArrowRight size={16} className="text-white/20" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Quick Actions */}
           <div className="bg-[#141720] border border-white/5 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-indigo-400"/> 
                快捷操作
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {QUICK_ACTIONS.map((action, idx) => (
                    // @ts-ignore
                  action.href ? (
                    <Link key={idx} href={action.href} className="flex flex-col p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-indigo-500/30 rounded-lg transition-all group">
                      <div className="flex justify-between items-center mb-3">
                         <action.icon size={20} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                         <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -rotate-45 text-indigo-500" size={14} />
                      </div>
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white">{action.label}</span>
                      <span className="text-xs text-slate-500 mt-1 line-clamp-1">{action.desc}</span>
                    </Link>
                  ) : (
                    <button key={idx} onClick={() => handleAction(action.action || '')} className="flex flex-col text-left p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-red-500/30 rounded-lg transition-all group">
                       <div className="flex justify-between items-center mb-3">
                         <action.icon size={20} className={`text-slate-400 group-hover:text-red-400 transition-colors ${isRefreshing && action.action === 'restart' ? 'animate-spin' : ''}`} />
                      </div>
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white">{action.label}</span>
                      <span className="text-xs text-slate-500 mt-1 line-clamp-1">{action.desc}</span>
                    </button>
                  )
                ))}
              </div>
           </div>

           {/* Live Logs */}
           <div className="lg:col-span-2 bg-[#141720] border border-white/5 rounded-xl p-6 flex flex-col h-[300px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText size={18} className="text-slate-400"/> 
                  实时系统日志
                </h3>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Live Stream
                </span>
              </div>
              <div className="flex-1 bg-black/40 rounded-lg border border-white/5 p-4 overflow-hidden font-mono text-xs relative">
                <div className="space-y-1.5 absolute inset-0 p-4 overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-3 hover:bg-white/[0.02] py-0.5 rounded px-1 transition-colors">
                      <span className="text-slate-600 shrink-0 select-none">{log.time}</span>
                      <span className={`shrink-0 w-10 text-center font-bold ${
                        log.level === 'INFO' ? 'text-blue-500' : 
                        log.level === 'WARN' ? 'text-yellow-500' : 
                        'text-red-500'
                      }`}>{log.level}</span>
                      <span className="text-slate-400 shrink-0 w-24 truncate select-none border-r border-white/5 mr-2">{log.module}</span>
                      <span className="text-slate-300 break-all">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
