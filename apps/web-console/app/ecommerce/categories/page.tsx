"use client";

import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Save,
  Image as ImageIcon,
  MoreVertical,
  RefreshCw,
  Search,
  FolderTree,
  Upload
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useToast } from '@/contexts/ToastContext';

// --- Types ---
interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  meta_info: {
    image_url?: string;
    description?: string;
    [key: string]: any;
  } | null;
  children?: Category[];
}

// --- API CONFIG ---
const API_BASE = 'http://localhost:8000/api/v1/categories'; 
const UPLOAD_API = 'http://localhost:8000/api/v1/files/upload';

// --- Tree Node Component ---
const CategoryTreeNode = ({ 
  category, 
  level = 0, 
  selectedId, 
  onSelect, 
  onAddChild 
}: { 
  category: Category; 
  level?: number; 
  selectedId: number | null; 
  onSelect: (cat: Category) => void;
  onAddChild: (parentId: number) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = category.id === selectedId;

  return (
    <div className="select-none text-sm">
      <div 
        className={`
          flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors group
          ${isSelected ? 'bg-slate-800 text-indigo-300 ring-1 ring-indigo-500/50' : 'hover:bg-slate-800 text-slate-300'}
        `}
        style={{ paddingLeft: `${Math.max(8, level * 12 + 8)}px` }}
        onClick={(e) => { e.stopPropagation(); onSelect(category); }}
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className={`p-0.5 hover:bg-slate-700/50 rounded flex-shrink-0 ${hasChildren ? '' : 'invisible'}`}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          <Folder size={14} className={`flex-shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
          <span className="truncate">{category.name}</span>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-slate-400 hover:text-white" 
                onClick={(e) => { e.stopPropagation(); onAddChild(category.id); }}
                title="Add Subcategory"
             >
                <Plus size={12} />
             </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="ml-2 border-l border-slate-700/30">
          {category.children?.map(child => (
            <CategoryTreeNode 
                key={child.id} 
                category={child} 
                level={level + 1} 
                selectedId={selectedId}
                onSelect={onSelect}
                onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { showToast } = useToast();
  
  // Editor State
  // editingId: null = creating new; number = editing existing
  const [editingId, setEditingId] = useState<number | null>(null); 
  const [formData, setFormData] = useState<{
    name: string;
    parent_id: number | null;
    image_url: string;
    description: string;
  }>({
    name: '',
    parent_id: null,
    image_url: '',
    description: ''
  });

  // Flatten categories function
  const flattenCategories = (cats: Category[], result: {id: number, name: string}[] = []) => {
      for (const cat of cats) {
          result.push({ id: cat.id, name: cat.name });
          if (cat.children && cat.children.length > 0) {
              flattenCategories(cat.children, result);
          }
      }
      return result;
  };

  // Memoize the flattened list
  const flattenedList = React.useMemo(() => flattenCategories(categories), [categories]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tree`); 
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSelect = (cat: Category) => {
    setSelectedCategory(cat);
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      parent_id: cat.parent_id,
      image_url: cat.meta_info?.image_url || '',
      description: cat.meta_info?.description || ''
    });
  };

  const handleCreateRoot = () => {
    setSelectedCategory(null);
    setEditingId(null);
    setFormData({
      name: '',
      parent_id: null,
      image_url: '',
      description: ''
    });
  };

  const handleCreateChild = (parentId: number) => {
     setSelectedCategory(null);
     setEditingId(null);
     setFormData({
        name: '',
        parent_id: parentId,
        image_url: '',
        description: ''
     });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
          showToast("分类名称不能为空", 'error');
          return;
      }

      const duplicate = flattenedList.find(c => 
          c.name.trim() === formData.name.trim() && c.id !== editingId
      );

      if (duplicate) {
          showToast("分类名称不能重复，请修改", 'error');
           // Highlight input
          const input = document.getElementById('category-name-input');
          if (input) {
              input.focus();
              input.classList.add('ring-2', 'ring-red-500', 'border-red-500');
              setTimeout(() => input.classList.remove('ring-2', 'ring-red-500', 'border-red-500'), 3000);
          }
          return;
      }
      
      const payload = {
        name: formData.name,
        parent_id: formData.parent_id,
        meta_info: {
            image_url: formData.image_url,
            description: formData.description
        }
      };

      let res;
      if (editingId) {
        // Update
        res = await fetch(`${API_BASE}/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
      } else {
        // Create
        res = await fetch(`${API_BASE}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "保存失败");
      }
      
      await fetchCategories();
      showToast(editingId ? "分类更新成功" : "分类创建成功", 'success');
      
      if (!editingId && !formData.parent_id) {
          handleCreateRoot();
      }
      // If editing, keep selection
      
    } catch (error: any) {
      showToast(`保存失败: ${error.message}`, 'error');
    }
  };

  const handleDelete = () => {
    if (!editingId) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!editingId) return;
    
    try {
        const res = await fetch(`${API_BASE}/${editingId}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) {
            const err = await res.json();
            showToast(err.detail || "删除失败", 'error');
            return;
        }
        
        showToast("分类已删除", 'success');
        handleCreateRoot();
        fetchCategories();
    } catch (error) {
        console.error(error);
        showToast("删除过程中发生错误", 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    // Simple uploading state or toast
    showToast("开始上传图片...", 'info');

    try {
        const res = await fetch(UPLOAD_API, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error("上传失败");
        
        const data = await res.json();
        setFormData(prev => ({ ...prev, image_url: data.url }));
        showToast("图片上传成功", 'success');
    } catch (error) {
        console.error(error);
        showToast("图片上传失败", 'error');
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] w-full p-6 grid grid-cols-12 gap-6 bg-slate-950/20">
      {/* Left Column: Tree */}
      <Card className="col-span-4 bg-[#1e293b] border-slate-700 flex flex-col h-full overflow-hidden shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4 border-b border-slate-800 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-lg text-slate-200">分类结构</CardTitle>
            <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={fetchCategories}>
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </Button>
                <Button onClick={handleCreateRoot} size="sm" variant="outline" className="h-8 text-xs bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200">
                    <Plus size={14} className="mr-1" /> 根分类
                </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <Input
              placeholder="搜索分类..."
              className="pl-8 h-8 bg-slate-900/50 border-slate-700 text-xs focus-visible:ring-indigo-500 placeholder:text-slate-600 text-slate-300"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2">
            {categories.length === 0 && !loading && (
                <div className="text-center text-slate-600 py-10 text-sm flex flex-col items-center gap-2">
                    <FolderTree size={32} className="opacity-20" />
                    <span>暂无分类数据</span>
                </div>
            )}
            
            <div className="space-y-0.5">
                {categories.map(cat => (
                    <CategoryTreeNode 
                        key={cat.id} 
                        category={cat} 
                        selectedId={editingId}
                        onSelect={handleSelect}
                        onAddChild={handleCreateChild}
                    />
                ))}
            </div>
        </CardContent>
      </Card>

      {/* Right Column: Editor */}
      <Card className="col-span-8 bg-[#1e293b] border-slate-700 flex flex-col h-full overflow-hidden shadow-sm">
         <CardHeader className="pb-4 pt-6 px-6 border-b border-slate-800 bg-slate-900/30 shrink-0">
             <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                        {editingId ? (
                            <>
                                <span className="text-indigo-400">编辑分类</span>
                                <Badge variant="secondary" className="bg-slate-800 text-slate-500 font-mono text-[10px] h-5">ID: {editingId}</Badge>
                            </>
                        ) : (
                            <>
                                <span className="text-teal-400">新建分类</span>
                                {formData.parent_id && (
                                    <Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px] h-5">
                                        Subcategory of ID: {formData.parent_id}
                                    </Badge>
                                )}
                            </>
                        )}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        {editingId 
                            ? "修改现有分类的名称、层级结构或元数据信息。" 
                            : "创建一个新的商品分类节点。"}
                    </p>
                </div>
                {editingId && (
                    <Button variant="destructive" size="sm" onClick={handleDelete} className="bg-red-950/30 hover:bg-red-900/50 text-red-500 border border-red-900/30 hover:border-red-800/50 transition-colors h-8">
                        <Trash2 size={14} className="mr-2" /> 删除分类
                    </Button>
                )}
             </div>
         </CardHeader>
         
         <CardContent className="p-8 space-y-8 overflow-y-auto flex-1">
            {/* Basic Info Section */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    基本信息
                </h3>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-slate-300 text-xs">分类名称 <span className="text-red-500">*</span></Label>
                        <Input 
                            id="category-name-input"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="例如：夏季男装"
                            className="bg-slate-900 border-slate-700 focus-visible:ring-indigo-500/50 text-slate-200 transition-all"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-slate-300 text-xs">父级分类 (Parent Category)</Label>
                        <div className="relative">
                            <select 
                                className="w-full flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 pl-8 py-2 text-sm text-slate-200 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.parent_id === null ? '' : formData.parent_id}
                                onChange={(e) => {
                                     const val = e.target.value;
                                     setFormData({...formData, parent_id: val === '' ? null : parseInt(val)});
                                }}
                            >
                                <option value="">根分类 (Root)</option>
                                {flattenedList.filter(c => c.id !== editingId).map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute left-2.5 top-2.5 text-slate-600 pointer-events-none">
                                <FolderTree strokeWidth={1.5} size={14} />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label className="text-slate-300 text-xs">描述信息</Label>
                    <Input 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="该分类的简要描述..."
                        className="bg-slate-900 border-slate-700 focus-visible:ring-indigo-500/50 text-slate-200"
                    />
                </div>
            </div>

            <div className="h-px bg-slate-800/80" />

            {/* Visuals Section */}
            <div className="space-y-4">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    视觉呈现
                </h3>
                
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-8 space-y-2">
                        <Label className="text-slate-300 text-xs">分类图片</Label>
                        <div className="space-y-3">
                             {/* File Upload Button */}
                             <div className="flex items-center gap-3">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                                    onClick={() => document.getElementById('category-image-upload')?.click()}
                                >
                                    <Upload size={14} className="mr-2" /> 上传图片
                                </Button>
                                <input 
                                    id="category-image-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleFileUpload}
                                />
                                <span className="text-[10px] text-slate-500">支持 *.png, *.jpg, *.webp (Max 5MB)</span>
                             </div>

                             {/* Manual URL Input */}
                             <div className="relative flex-1">
                                <Input 
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                                    placeholder="或输入图片 URL..."
                                    className="bg-slate-900 border-slate-700 font-mono text-xs text-slate-300 placeholder:text-slate-600 pl-8"
                                />
                                <div className="absolute left-2.5 top-2.5 text-slate-600 pointer-events-none">
                                    <ImageIcon strokeWidth={1.5} size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-span-4">
                        <Label className="text-slate-300 pb-2 block text-xs">预览</Label>
                        <div className="w-full aspect-square max-w-[120px] bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden relative group">
                            {formData.image_url ? (
                                <>
                                    <img 
                                        src={formData.image_url} 
                                        alt="Category Cover" 
                                        className="w-full h-full object-cover transition-opacity duration-300"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }} 
                                    />
                                    <div className="hidden absolute inset-0 flex flex-col gap-1 items-center justify-center bg-slate-900 text-slate-500">
                                        <AlertTriangle size={20} className="text-amber-500/50" />
                                        <span className="text-[10px]">无法加载图片</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-700">
                                    <ImageIcon size={24} strokeWidth={1} />
                                    <span className="text-[10px]">无图片</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="pt-8 flex justify-end gap-3 mt-auto border-t border-slate-800/50">
                 <Button variant="ghost" onClick={handleCreateRoot} className="text-slate-400 hover:text-white hover:bg-slate-800">
                    重置表单
                 </Button>
                 <Button onClick={handleSave} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white min-w-[120px] shadow-lg shadow-indigo-900/20">
                    <Save size={16} /> 保存
                 </Button>
            </div>
         </CardContent>
      </Card>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] transition-all">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-sm p-0 overflow-hidden transform transition-all scale-100 opacity-100 ring-1 ring-white/10">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-900/20 flex items-center justify-center flex-shrink-0">
                            <Trash2 size={20} className="text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-100 text-lg">确认删除分类？</h3>
                            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                                您确定要删除 <span className="text-slate-200 font-medium">"{categories.find(c => c.id === editingId)?.name}"</span> 吗？
                                <br/>此操作无法撤销。
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-slate-900/50 px-6 py-4 flex justify-end gap-3 border-t border-slate-800">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        取消
                    </Button>
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleConfirmDelete}
                        className="bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20"
                    >
                        确认删除
                    </Button>
                </div>
            </div>
        </div>
      )}
      
      {/* Missing component import fix */}
      <div className="hidden">
        <MoreVertical />
        <AlertTriangle />
      </div>
    </div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
