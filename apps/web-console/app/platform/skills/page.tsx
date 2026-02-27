"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Search, Server, FileText, Sparkles, Terminal, Plus, Trash2, Edit } from 'lucide-react';
import { useToast } from "@/contexts/ToastContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SkillSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Mock State - in production this would fetch from API
  const [config, setConfig] = useState({
    web_search_enabled: true,
    serp_api_key: "**********************",
    rpa_enabled: true,
    rpa_worker_url: "http://rpa-worker.internal:8000",
    ppt_enabled: true,
    ppt_template_path: "/storage/ppt_templates/default.pptx"
  });

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      showToast("配置已保存", "success");
    }, 1000);
  };

  return (
    <div className="p-8">
      {/* Header aligned with Service/Skills */}
      <div className="flex justify-between items-center mb-6">
           <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Sparkles className="text-violet-500" />
              技能工具箱 (Skills Capability Center)
          </h1>
          <Button onClick={handleSave} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-lg shadow-violet-500/20">
              <Save size={16} /> {loading ? "保存中..." : "保存全局配置"}
          </Button>
      </div>
      
      <p className="text-slate-400 mb-8 max-w-3xl">
          管理数字员工可调用的核心能力模块。既包括基础服务的连接配置，也包含业务层面的具体技能定义。
      </p>

      <Tabs defaultValue="library" className="w-full">
        <TabsList className="mb-6 bg-slate-900 border border-slate-700/50">
           <TabsTrigger value="library" className="px-6 data-[state=active]:bg-violet-600">
             <Terminal className="w-4 h-4 mr-2" />
             业务技能 (Business Skills)
           </TabsTrigger>
           <TabsTrigger value="config" className="px-6 data-[state=active]:bg-violet-600">
             <Server className="w-4 h-4 mr-2" />
             基础技能 (Base Skills)
           </TabsTrigger>
        </TabsList>

        {/* Tab 1: 业务技能 (原 Registry) */}
        <TabsContent value="library" className="animate-in fade-in slide-in-from-left-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Order Status */}
                <div className="glass-card p-6 relative group hover:bg-slate-800/60 transition-all border-0">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => showToast("功能开发中: 技能编辑器即将上线", "info")} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><Edit size={16}/></button>
                        <button onClick={() => showToast("功能开发中: 删除功能开发中", "warning")} className="p-1 hover:bg-red-900/30 rounded text-red-400 hover:text-red-300 transition-colors"><Trash2 size={16}/></button>
                    </div>
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400 mb-4 border border-green-500/20">
                        <Terminal size={20} />
                    </div>
                    <div className="mb-1">
                        <h3 className="font-semibold text-lg text-white">订单状态查询</h3>
                        <p className="text-xs text-slate-500 font-mono">Check Order Status</p>
                    </div>
                    <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-slate-400 border border-slate-700">check_order_status</code>
                    <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                        查询订单物流状态的业务工具。调用 ERP API 返回发货进度与预计送达时间。
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-2">
                         <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-xs rounded border border-violet-500/20">Business</span>
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded border border-slate-600">Python</span>
                    </div>
                </div>

                {/* 2. CRM Info */}
                <div className="glass-card p-6 relative group hover:bg-slate-800/60 transition-all border-0">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => showToast("功能开发中: 技能编辑器即将上线", "info")} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><Edit size={16}/></button>
                    </div>
                     <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
                        <Terminal size={20} />
                    </div>
                    <div className="mb-1">
                        <h3 className="font-semibold text-lg text-white">CRM 客户画像</h3>
                        <p className="text-xs text-slate-500 font-mono">Get Customer Profile</p>
                    </div>
                    <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-slate-400 border border-slate-700">get_crm_profile</code>
                    <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                        从 CRM 系统拉取客户画像与历史跟进记录。
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-2">
                        <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-xs rounded border border-violet-500/20">Business</span>
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded border border-slate-600">Python</span>
                    </div>
                </div>

                 {/* 3. Web Search (System) */}
                 <div className="glass-card p-6 relative group hover:bg-slate-800/60 transition-all border-0">
                     <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
                        <Search size={20} />
                    </div>
                    <div className="mb-1">
                        <h3 className="font-semibold text-lg text-white">联网搜索</h3>
                        <p className="text-xs text-slate-500 font-mono">Web Search</p>
                    </div>
                    <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-slate-400 border border-slate-700">web_search</code>
                    <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                        [系统预置] 联网深度搜索能力。依赖“基础技能”中的 API Key。
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-2">
                        <span className="px-2 py-0.5 bg-slate-500/10 text-slate-400 text-xs rounded border border-slate-500/20">System</span>
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded border border-slate-600">Built-in</span>
                    </div>
                </div>

                {/* Add New */}
                <div onClick={() => showToast("功能开发中: 技能编辑器即将上线", "info")} className="border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:border-violet-500/50 hover:text-violet-400 transition-all cursor-pointer h-[240px] bg-slate-800/20 hover:bg-slate-800/40">
                    <div className="flex flex-col items-center gap-2">
                         <Plus size={32} />
                         <span className="text-sm font-medium">注册新业务技能</span>
                    </div>
                </div>
            </div>
        </TabsContent>

        {/* Tab 2: 基础设施配置 (原 Config 内容) */}
        <TabsContent value="config" className="animate-in fade-in slide-in-from-right-4">
             <div className="grid gap-6 max-w-5xl">
                {/* Web Search Config */}
                <div className="glass-card p-6 border-0">
                <div className="flex flex-row items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <Search size={24} />
                    </div>
                    <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">联网深度调研 (Deep Research)</h3>
                    <p className="text-sm text-slate-400">配置 Google/Bing 搜索接口，赋予员工实时联网获取信息的能力。</p>
                    </div>
                    <Switch checked={config.web_search_enabled} onCheckedChange={(v) => setConfig({...config, web_search_enabled: v})} />
                </div>
                
                {config.web_search_enabled && (
                    <div className="pl-16 grid gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid gap-2">
                        <Label htmlFor="api_key" className="text-slate-300">SerpApi Key / Bing API Key</Label>
                        <div className="flex gap-2">
                        <Input 
                            id="api_key" 
                            type="password" 
                            value={config.serp_api_key} 
                            className="bg-black/30 border-white/10 text-white"
                            onChange={(e) => setConfig({...config, serp_api_key: e.target.value})}
                        />
                        <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">验证连接</Button>
                        </div>
                        <p className="text-xs text-slate-500">用于 <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300">web_search</code> 技能调用外部搜索引擎。</p>
                    </div>
                    </div>
                )}
                </div>

                {/* RPA Config */}
                <div className="glass-card p-6 border-0">
                <div className="flex flex-row items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                    <Server size={24} />
                    </div>
                    <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">RPA 浏览器自动化 (Browser Automation)</h3>
                    <p className="text-sm text-slate-400">配置 RPA Worker 集群地址，用于执行网页操作、截图与模拟登录任务。</p>
                    </div>
                    <Switch checked={config.rpa_enabled} onCheckedChange={(v) => setConfig({...config, rpa_enabled: v})} />
                </div>
                
                {config.rpa_enabled && (
                    <div className="pl-16 grid gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid gap-2">
                        <Label htmlFor="rpa_url" className="text-slate-300">RPA Worker URL</Label>
                        <Input 
                        id="rpa_url" 
                        value={config.rpa_worker_url}
                        className="bg-black/30 border-white/10 text-white"
                        onChange={(e) => setConfig({...config, rpa_worker_url: e.target.value})} 
                        />
                        <p className="text-xs text-slate-500">指向 <code className="bg-slate-800 px-1 py-0.5 rounded text-purple-300">rpa-worker</code> 服务的内部地址。</p>
                    </div>
                    </div>
                )}
                </div>

                {/* PPT Config */}
                <div className="glass-card p-6 border-0">
                <div className="flex flex-row items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 border border-orange-500/20">
                    <FileText size={24} />
                    </div>
                    <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">文档/PPT 生成引擎 (Deliverables)</h3>
                    <p className="text-sm text-slate-400">管理输出文档的模板库与样式规范。</p>
                    </div>
                    <Switch checked={config.ppt_enabled} onCheckedChange={(v) => setConfig({...config, ppt_enabled: v})} />
                </div>
                
                {config.ppt_enabled && (
                    <div className="pl-16 grid gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid gap-2">
                        <Label htmlFor="ppt_template" className="text-slate-300">默认 PPT 模板路径</Label>
                        <Input 
                        id="ppt_template" 
                        value={config.ppt_template_path}
                        className="bg-black/30 border-white/10 text-white"
                        onChange={(e) => setConfig({...config, ppt_template_path: e.target.value})} 
                        />
                    </div>
                    </div>
                )}
                </div>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
