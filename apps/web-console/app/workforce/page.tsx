"use client";
import React, { useState, useEffect } from 'react';
import { Plus, User, Zap, Briefcase } from 'lucide-react';
import Link from 'next/link';

const API_URL = "http://localhost:8000";

export default function WorkforcePage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hardcode some employees for demo if API fails or is empty, 
    // but try to fetch first.
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/agents/1/employees`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
              setEmployees(data);
          } else {
              // Fallback to "Create One" state
              setEmployees([]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch employees", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">数字员工大厅</h1>
            <p className="text-slate-400 mt-2">管理您的 AI 员工团队并分配任务。</p>
          </div>
          <Link href="/workforce/create">
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
              <Plus size={18} />
              <span>新建员工</span>
            </button>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
             <div className="text-center py-20 text-slate-500">Loading workforce...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Employee Cards */}
                {employees.map((emp: any) => (
                <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-900/10 group">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                                    {emp.avatar_url ? (
                                        <img src={emp.avatar_url} alt={emp.name} className="h-full w-full object-cover rounded-full" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{emp.name}</h3>
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-indigo-300 border border-indigo-500/20 capitalize">
                                        {emp.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-slate-400 text-sm mb-6 h-10 line-clamp-2">
                            {emp.description}
                        </p>

                        <div className="space-y-3">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Capabilities</div>
                            <div className="flex flex-wrap gap-2">
                                {emp.capabilities?.map((cap: string, i: number) => (
                                    <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                        {cap}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 mt-auto">
                        <Link href={`/workforce/mission?employee_id=${emp.id}`}>
                            <button className="w-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg border border-slate-700 transition-colors">
                                <Zap className="mr-2 h-4 w-4 text-amber-400" /> Assign Mission
                            </button>
                        </Link>
                    </div>
                </div>
                ))}

                {/* Create New Card (if empty or as last item) */}
                <Link href="/workforce/create" className="group block h-full">
                    <div className="h-full bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 hover:border-slate-700 hover:bg-slate-900/50 transition-all cursor-pointer min-h-[300px]">
                        <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="font-medium text-slate-300">Recruit New Employee</h3>
                        <p className="text-slate-500 text-sm mt-2 text-center">Add a new digital worker to your team</p>
                    </div>
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}
