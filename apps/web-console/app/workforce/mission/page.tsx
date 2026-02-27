"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, CheckCircle, Clock, ArrowRight, Loader2, Play } from 'lucide-react';
import Link from 'next/link';

const API_URL = "http://localhost:8000";

export default function MissionPage() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employee_id');
  const [employee, setEmployee] = useState<any>(null);
  const [objective, setObjective] = useState("");
  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState(false); // AI thinking state

  // Load Employee details
  useEffect(() => {
     if(employeeId) {
         // Should have an endpoint to get single employee, but for now I'll use the list or assume context
         // Ideally: fetch(`${API_URL}/agents/employees/${employeeId}`)
     }
  }, [employeeId]);

  const handleStartMission = async () => {
    if (!objective.trim()) return;
    setPlanning(true);
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/agents/missions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                employee_id: parseInt(employeeId || "0"), // Fallback if missing
                title: "New Mission", // Could be extracted from objective
                objective: objective
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            // Poll for updates if it was async, or just set if sync
            setMission(data); 
            // If the plan is empty, we might need to poll. 
            // Our backend implementation was synchronous for the demo, so `data` should have tasks.
            if (data.id) {
                 fetchMissionDetails(data.id);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        setPlanning(false);
    }
  };

  const fetchMissionDetails = async (id: number) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/agents/missions/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) {
          const data = await res.json(); // { mission, tasks }
          setMission(data);
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex flex-col h-screen">
       {/* Header */}
       <div className="border-b border-slate-800 pb-6 mb-6">
           <Link href="/workforce" className="text-sm text-slate-500 hover:text-white mb-4 inline-block">← Back to Team</Link>
           <h1 className="text-2xl font-bold text-white">Mission Control</h1>
           <p className="text-slate-400">Assign a high-level goal and watch the agent break it down.</p>
       </div>

       <div className="flex flex-1 gap-8 overflow-hidden">
           {/* Left: Chat / Input */}
           <div className="w-1/3 flex flex-col space-y-4">
               <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex-1 flex flex-col">
                   <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                        {/* Agent Greeting */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold">AI</div>
                            <div className="bg-slate-800 p-3 rounded-lg rounded-tl-none text-sm text-slate-300">
                                Ready for orders. What is my next objective?
                            </div>
                        </div>

                        {/* User Objective */}
                        {mission && (
                            <div className="flex gap-4 flex-row-reverse">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold">YOU</div>
                                <div className="bg-indigo-900/50 border border-indigo-500/30 p-3 rounded-lg rounded-tr-none text-sm text-white">
                                    {mission.mission?.objective || objective}
                                </div>
                            </div>
                        )}
                   </div>

                   {/* Input Area */}
                   {!mission ? (
                        <div className="relative">
                            <textarea 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-32"
                                placeholder="E.g. Conduct a competitive analysis of '思渡AI' product pricing..."
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                            />
                            <button 
                                onClick={handleStartMission}
                                disabled={planning || !objective.trim()}
                                className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 p-2 rounded-md disabled:opacity-50 transition-colors"
                            >
                                {planning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </button>
                        </div>
                   ) : (
                       <div className="text-center p-4 bg-slate-950/50 rounded-lg border border-slate-800 text-slate-500 text-sm">
                           Mission in progress. Check the plan on the right.
                       </div>
                   )}
               </div>
           </div>

           {/* Right: Plan Display */}
           <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
               <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                   <h2 className="font-semibold text-white flex items-center">
                       <Clock className="mr-2 h-4 w-4 text-indigo-400" /> Execution Plan
                   </h2>
                   {mission && (
                       <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase font-bold">
                           {mission.mission?.status}
                       </span>
                   )}
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   {!mission && !planning && (
                       <div className="h-full flex flex-col items-center justify-center text-slate-600">
                           <Play className="h-12 w-12 mb-4 opacity-20" />
                           <p>No mission active.</p>
                       </div>
                   )}

                   {planning && (
                       <div className="space-y-4 animate-pulse">
                           <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                           <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                           <div className="h-32 bg-slate-800 rounded w-full"></div>
                       </div>
                   )}
                   
                   {mission?.tasks?.map((task: any, index: number) => (
                       <div key={task.id} className="relative pl-8 border-l-2 border-slate-800 last:border-0 pb-6">
                           {/* Timeline Dot */}
                           <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 ${
                               task.status === 'completed' ? 'bg-green-500 border-green-500' : 
                               task.status === 'in_progress' ? 'bg-indigo-500 border-indigo-500' : 
                               'bg-slate-900 border-slate-600'
                           }`}></div>

                           <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                               <div className="flex justify-between items-start mb-2">
                                   <h3 className="font-medium text-slate-200">
                                       <span className="text-slate-500 mr-2">Step {task.order_index || index+1}</span>
                                       {task.title || `Task ${task.id}`}
                                   </h3>
                                   <span className="text-xs bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                                       {task.task_type}
                                   </span>
                               </div>
                               <p className="text-sm text-slate-400 mb-3">{task.description}</p>
                               
                               {/* Output Area (if any) */}
                               {task.result_data && (
                                   <div className="bg-slate-950 p-3 rounded text-xs font-mono text-green-400 border border-slate-800 mt-2">
                                       {JSON.stringify(task.result_data)}
                                   </div>
                               )}
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       </div>
    </div>
  );
}
