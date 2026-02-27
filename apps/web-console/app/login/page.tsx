"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from "../../contexts/ToastContext"; 
import { useAuth } from "../../contexts/AuthContext"; 
import { BrainCircuit, Sparkles, Zap, BarChart3, ScanLine, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [wechatUrl, setWechatUrl] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();
  const { login } = useAuth();

  useEffect(() => {
    // 获取微信登录链接
    const fetchWeChatUrl = async () => {
        try {
            // Use configured global API URL first, fallback to dynamic logic
            const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
            let apiBase = envApiUrl;

            if (!apiBase) {
                const protocol = window.location.protocol; 
                const hostname = window.location.hostname;
                apiBase = `${protocol}//${hostname}:8000`;
            }
            
            const res = await fetch(`${apiBase}/auth/wechat/url`);
            const data = await res.json();
            if (data.url && !data.mock_mode) {
                setWechatUrl(data.url);
                setIsMockMode(false);
            } else {
                setIsMockMode(true);
            }
        } catch (e) {
            console.error("Failed to fetch WeChat URL", e);
            setIsMockMode(true);
        }
    };
    fetchWeChatUrl();
  }, []);

  // 处理微信回调 Login
  useEffect(() => {
    // 仅在客户端执行
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
             // 避免重复请求 (React StrictMode 可能导致两次)
             const hasProcessed =  window.sessionStorage.getItem('wx_code_processed');
             if (hasProcessed !== code) {
                 window.sessionStorage.setItem('wx_code_processed', code);
                 // 清除 URL 上的 code 参数，防止刷新重复提交
                 window.history.replaceState({}, document.title, "/login");
                 performLogin(code);
             }
        }
    }
  }, []);

  const performLogin = async (code: string) => {
      setLoading(true);
      try {
        const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
        let apiBase = envApiUrl;

        if (!apiBase) {
            const protocol = window.location.protocol; 
            const hostname = window.location.hostname;
            apiBase = `${protocol}//${hostname}:8000`;
        }

        const response = await fetch(`${apiBase}/auth/wechat/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Login failed');
        }

        const data = await response.json();
        
        console.log("Login Response Data:", data); // Debug log

        // Ensure we prioritize displaying the nickname, and fallback to username only if absolutely necessary
        const displayName = data.nickname && data.nickname.trim() !== "" ? data.nickname : data.username;
        const displayAvatar = data.avatar || data.headimgurl;

        login(data.access_token, {
            id: data.user_id,
            username: data.username,
            role: data.role,
            org_id: data.organization_id,
            avatar: displayAvatar,
            nickname: displayName,
            invite_code: data.invite_code // Add invite code
        });

        showToast("登录成功！欢迎登录数字员工平台", "success");
        // Login function handles redirection
        
      } catch (error: any) {
        showToast(error.message || "登录失败，请重试", "error");
        console.error(error);
        // 如果失败，清除处理标记以便重试
        window.sessionStorage.removeItem('wx_code_processed');
      } finally {
        setLoading(false);
      }
  };

  const handleMockLogin = async () => {
    // 模拟一个随机的微信 Code
    const mockCode = "mock_wx_code_" + Math.random().toString(36).substring(7);
    await performLogin(mockCode);
  };

  return (
    <div className="min-h-screen flex w-full bg-[#0B0D14] text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* 左侧：品牌与价值主张 (更加聚焦，布局更紧凑) */}
      <div className="hidden lg:flex flex-col justify-center w-[60%] relative px-16 bg-[#0B0D14] overflow-hidden">
        
        {/* 背景动效 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
             <div className="absolute top-[10%] left-[10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
             <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]"></div>
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        </div>

        {/* 内容容器 */}
        <div className="relative z-10 max-w-2xl pl-8">
            {/* Logo */}
            <Link href={process.env.NEXT_PUBLIC_OFFICIAL_SITE_URL || "http://localhost:3000"} className="flex items-center gap-3 mb-6 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="relative w-10 h-10">
                    <Image 
                        src="/logo.png" 
                        alt="Digital Employee Logo" 
                        fill
                        className="object-contain"
                    />
                </div>
                <span className="text-xl font-bold tracking-wide text-white">
                    思渡数字员工
                </span>
            </Link>

            {/* 主标题 */}
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold leading-[1.2] mb-4 tracking-tight">
                    构建属于您的<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                         AI 数字员工集群
                    </span>
                </h1>
                <p className="text-base text-gray-400 leading-relaxed font-light max-w-lg">
                    企业级 AI 中台。统一管理您的 <strong>数字员工 (Agents)</strong>、<strong>知识资产 (RAG)</strong> 与 <strong>品牌内容 (GEO)</strong>。
                    <br/>
                    让 AI 成为真正的生产力。
                </p>
            </div>

            {/* 核心功能点 - 横向并排 */}
            <div className="grid grid-cols-3 gap-4 mt-8 w-full">
                <FeatureCard 
                    icon={BrainCircuit} 
                    title="智能体Agent" 
                    desc="零代码编排业务智能体与工作流。"
                />
                <FeatureCard 
                    icon={ShieldCheck} 
                    title="知识库中台" 
                    desc="基于 RAG 的企业级知识检索增强。"
                />
                <FeatureCard 
                    icon={BarChart3} 
                    title="GEO 品牌增长" 
                    desc="优化 AI 搜索引擎品牌排名与内容营销。"
                />
            </div>
            
            <div className="mt-12 text-xs text-gray-600 border-t border-white/5 pt-5 w-full">
                © 2026 思渡数字员工 (sdosoft.com)  |  为企业提供下一代数字员工解决方案
            </div>
        </div>
      </div>

      {/* 右侧：极简登录区 */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 bg-[#151921] border-l border-white/5 shadow-2xl relative">
         
         <div className="w-full max-w-sm">
            <div className="bg-[#1C1F26] rounded-2xl p-10 shadow-2xl border border-white/5 relative overflow-hidden text-center">
                
                <h2 className="text-2xl font-semibold text-white mb-2">欢迎登录数字员工平台</h2>
                <p className="text-gray-400 text-sm mb-8">请使用微信扫码登录系统，新用户将自动注册</p>
                
                {/* 二维码区域 */}
                <div className="flex flex-col items-center justify-center mb-8 min-h-[200px]">
                    {!isMockMode && wechatUrl ? (
                         <div className="w-[300px] h-[350px] overflow-hidden rounded-lg bg-white shadow-lg">
                            <iframe 
                                src={wechatUrl}
                                frameBorder="0"
                                scrolling="no"
                                width="300px"
                                height="400px"
                                className="-mt-[50px]" // 调整 iframe 内容位置以隐藏顶部微信标题栏 (可选)
                            ></iframe>
                         </div>
                    ) : (
                    <div className="relative group/qr cursor-pointer transition-transform duration-300 hover:scale-[1.02]" onClick={handleMockLogin}>
                        {/* 模拟二维码样式 */}
                        <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center shadow-lg border-4 border-white">
                            <div className="w-full h-full border-2 border-dashed border-gray-300 p-2 flex flex-col items-center justify-center">
                                 <ScanLine size={40} className="text-gray-800 opacity-80 mb-2" />
                                 {/* 模拟二维码矩阵 */}
                                 <div className="grid grid-cols-5 gap-1 w-24 h-24 opacity-80">
                                     {[...Array(25)].map((_, i) => (
                                         <div key={i} className={`bg-black rounded-sm ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`}></div>
                                     ))}
                                 </div>
                            </div>
                        </div>
                        
                        {/* 悬停遮罩 */}
                        <div className="absolute inset-0 bg-indigo-900/90 opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg backdrop-blur-[2px]">
                            <div className="text-center">
                                 <ScanLine className="w-10 h-10 text-white mx-auto mb-2 animate-pulse" />
                                 <p className="text-white font-medium text-sm">点击模拟扫码成功</p>
                            </div>
                        </div>

                        {/* Loading 状态 */}
                        {loading && (
                            <div className="absolute inset-0 bg-[#1C1F26]/95 z-30 flex items-center justify-center rounded-lg">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                    <span className="text-indigo-400 text-xs font-medium">安全验证中...</span>
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>微信安全连接已就绪</span>
                    </div>
                </div>

            </div>

            {/* 底部帮助 */}
            <div className="mt-8 text-center">
                <p className="text-xs text-gray-500 mb-2">
                    {isMockMode ? "当前模式: 本地模拟开发 (Mock)" : "当前模式: 微信官方连接"}
                </p>
                <p className="text-xs text-gray-600 hover:text-gray-500 cursor-pointer transition">
                    遇到问题？联系客服获取帮助
                </p>
            </div>
         </div>
      </div>
    </div>
  );
}

// 辅助组件：功能卡片 (竖向布局)
function FeatureCard({icon: Icon, title, desc}: any) {
    return (
        <div className="flex flex-col items-start p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:-translate-y-1 transition-all duration-300">
            <div className="mb-3 p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Icon size={20} />
            </div>
            <h3 className="font-semibold text-sm text-white mb-2">{title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-light">{desc}</p>
        </div>
    )
}
