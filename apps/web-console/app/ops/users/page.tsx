"use client";
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Loader2, 
  RefreshCw,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Mail,
  User as UserIcon,
  Crown,
  X
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

interface User {
    id: number;
    username: string;
    nickname?: string;
    email?: string;
    avatar?: string;
    role: string;
    organization_id?: number;
    organization_name?: string;
    created_at: string;
    is_active: boolean;
}

export default function UsersPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'}/api/v1/admin`;

    const fetchUsers = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/users?limit=100`, {
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                showToast("获取用户列表失败", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("网络连接错误", "error");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchUsers();
    };

    const filteredUsers = users.filter(u => 
        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.nickname && u.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.organization_name && u.organization_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getRoleBadge = (role: string) => {
        switch(role) {
            case 'admin':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><ShieldAlert size={12}/> 系统管理员</span>;
            case 'enterprise_admin':
                 return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20"><Crown size={12}/> 企业管理员</span>;
            default:
                 return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20"><UserIcon size={12}/> 普通账号</span>;
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0B0D14] overflow-hidden">
             {/* Header */}
             <div className="flex-none p-6 border-b border-white/5 bg-[#0f172a] flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                        <Users className="text-blue-400" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">用户管理</h1>
                        <p className="text-xs text-slate-400 mt-1">
                            管理系统所有注册用户及其权限
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                     <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            placeholder="搜索用户名、邮箱或企业..."
                            className="w-full pl-9 h-9 bg-white/5 border border-white/10 rounded-md text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                     <button
                         onClick={handleRefresh}
                         className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                         title="刷新"
                    >
                        <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                    </button>
                    {/* Placeholder for Add User if needed */}
                    {/* <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> 新增用户
                    </button> */}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-[#141720] border border-white/5 rounded-xl overflow-hidden min-h-[500px] flex flex-col">
                    {loading ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                            <p className="text-sm">正在加载用户列表...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                             <Users size={48} className="opacity-20 mb-4" />
                             <p>暂无符合条件的用户</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase text-slate-500 font-bold bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">用户</th>
                                    <th className="px-6 py-4">角色</th>
                                    <th className="px-6 py-4">所属企业</th>
                                    <th className="px-6 py-4">状态</th>
                                    <th className="px-6 py-4">注册时间</th>
                                    <th className="px-6 py-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.username || 'User'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon size={14} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-200 font-medium">{user.nickname || user.username || '未命名用户'}</span>
                                                    <span className="text-slate-500 text-xs">{user.email || '无邮箱'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.organization_name ? (
                                                 <div className="flex items-center gap-2 text-slate-300">
                                                     <Building2 size={14} className="text-indigo-400" />
                                                     {user.organization_name}
                                                 </div>
                                            ) : (
                                                <span className="text-slate-600 italic">未加入组织</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                                                <span className={user.is_active ? 'text-green-400' : 'text-red-400'}>
                                                    {user.is_active ? '正常' : '禁用'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                            {new Date(user.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedUser(user)}
                                                className="text-blue-400 hover:text-blue-300 text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all">
                                                详情
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {/* User Details Modal */}
            {selectedUser && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-[#1e2230] border border-white/10 rounded-xl p-6 w-[480px] shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                    {selectedUser.avatar ? (
                                        <img src={selectedUser.avatar} alt={selectedUser.username || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={32} className="text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{selectedUser.nickname || selectedUser.username || '未命名用户'}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getRoleBadge(selectedUser.role)}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${selectedUser.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {selectedUser.is_active ? '状态: 正常' : '状态: 禁用'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4 bg-black/20 rounded-lg p-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">用户名</label>
                                    <p className="text-sm text-slate-200 font-mono">{selectedUser.username || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">电子邮箱</label>
                                    <p className="text-sm text-slate-200 font-mono">{selectedUser.email || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属企业</label>
                                    <p className="text-sm text-slate-200">
                                        {selectedUser.organization_name ? (
                                            <span className="flex items-center gap-1">
                                                <Building2 size={12} className="text-indigo-400"/> {selectedUser.organization_name}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 italic">未加入</span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">注册时间</label>
                                    <p className="text-sm text-slate-200 font-mono">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">用户 ID</label>
                                    <p className="text-sm text-slate-200 font-mono">#{selectedUser.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors text-sm"
                                onClick={() => setSelectedUser(null)}
                            >
                                关闭
                            </button>
                            {/* Placeholder for future edit actions */}
                            <button 
                                className="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-medium transition-colors text-sm border border-blue-500/20"
                                onClick={() => {
                                    showToast("编辑功能开发中", "info");
                                }}
                            >
                                编辑资料
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
