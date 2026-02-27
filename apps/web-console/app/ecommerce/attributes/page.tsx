"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  SlidersHorizontal,
  BoxSelect, 
  List,
  CheckSquare,
  Type,
  ToggleLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

// --- Types ---
type AttributeType = 'text' | 'select' | 'multi_select' | 'boolean' | 'date';

interface AttributeValue {
  id: string;
  label: string;
  value: string;
}

interface ProductAttribute {
  id: string;
  name: string; // e.g. "Color", "Model Year"
  code: string; // e.g. "color", "model_year"
  type: AttributeType;
  isRequired: boolean;
  isFilterable: boolean; // Can be used in sidebar filters
  isSalesAttribute: boolean; // Generates Variants/SKUs (e.g. Color/Size)
  values: AttributeValue[]; // Predefined values
  categoryCount?: number; // How many categories use this
}

// --- Mock Data ---
const MOCK_ATTRIBUTES: ProductAttribute[] = [
  {
    id: 'attr_1',
    name: '颜色',
    code: 'color',
    type: 'select',
    isRequired: true,
    isFilterable: true,
    isSalesAttribute: true,
    values: [
      { id: 'v1', label: '黑色', value: '#000000' },
      { id: 'v2', label: '白色', value: '#FFFFFF' },
      { id: 'v3', label: '红色', value: '#FF0000' },
    ],
    categoryCount: 12
  },
  {
    id: 'attr_2',
    name: '尺码 (服装)',
    code: 'size_clothing',
    type: 'select',
    isRequired: true,
    isFilterable: true,
    isSalesAttribute: true,
    values: [
      { id: 's1', label: 'S', value: 'S' },
      { id: 's2', label: 'M', value: 'M' },
      { id: 's3', label: 'L', value: 'L' },
      { id: 's4', label: 'XL', value: 'XL' },
    ],
    categoryCount: 8
  },
  {
    id: 'attr_3',
    name: '材质',
    code: 'material',
    type: 'multi_select',
    isRequired: false,
    isFilterable: true,
    isSalesAttribute: false,
    values: [
      { id: 'm1', label: '棉', value: 'cotton' },
      { id: 'm2', label: '聚酯纤维', value: 'polyester' },
      { id: 'm3', label: '真丝', value: 'silk' },
    ],
    categoryCount: 15
  },
  {
    id: 'attr_4',
    name: '上市年份',
    code: 'launch_year',
    type: 'text',
    isRequired: false,
    isFilterable: true,
    isSalesAttribute: false,
    values: [],
    categoryCount: 20
  }
];

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<ProductAttribute[]>(MOCK_ATTRIBUTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<ProductAttribute | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ProductAttribute>>({
    name: '',
    code: '',
    type: 'text',
    isRequired: false,
    isFilterable: false,
    isSalesAttribute: false,
    values: []
  });

  const [newValueInput, setNewValueInput] = useState('');

  const handleEdit = (attr: ProductAttribute) => {
    setEditingAttribute(attr);
    setFormData({ ...attr });
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingAttribute(null);
    setFormData({
      name: '',
      code: '',
      type: 'text',
      isRequired: false,
      isFilterable: false,
      isSalesAttribute: false,
      values: []
    });
    setShowEditor(true);
  };

  const handleAddValue = () => {
    if (!newValueInput.trim()) return;
    const newVal: AttributeValue = {
      id: Math.random().toString(36).substr(2, 9),
      label: newValueInput,
      value: newValueInput
    };
    setFormData(prev => ({
      ...prev,
      values: [...(prev.values || []), newVal]
    }));
    setNewValueInput('');
  };

  const handleRemoveValue = (id: string) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values?.filter(v => v.id !== id)
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) return;

    const newAttr = {
      ...formData,
      id: editingAttribute?.id || Math.random().toString(36).substr(2, 9),
      categoryCount: editingAttribute?.categoryCount || 0
    } as ProductAttribute;

    if (editingAttribute) {
      setAttributes(attributes.map(a => a.id === editingAttribute.id ? newAttr : a));
    } else {
      setAttributes([...attributes, newAttr]);
    }
    setShowEditor(false);
  };

  const getTypeIcon = (type: AttributeType) => {
    switch (type) {
      case 'text': return <Type size={14} />;
      case 'select': return <List size={14} />;
      case 'multi_select': return <CheckSquare size={14} />;
      case 'boolean': return <ToggleLeft size={14} />;
      default: return <BoxSelect size={14} />;
    }
  };

  const filteredAttributes = attributes.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0 sticky top-0 z-10 bg-[rgb(var(--background))] pb-4 pt-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">商品属性库</h2>
          <p className="text-slate-500 text-sm">统一管理商品规格、参数与筛选属性</p>
        </div>
        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus size={16} className="mr-2" />
          新建属性
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left List */}
        <Card className={`bg-[#1e293b]/50 border-slate-800 flex flex-col ${showEditor ? 'col-span-8' : 'col-span-12'}`}>
          <CardHeader className="pb-3 pt-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="搜索属性名称或编码..." 
                className="pl-9 bg-slate-900/50 border-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-xs font-semibold text-slate-500 px-4 pb-2 border-b border-slate-800">
                <div className="col-span-4">属性名称 / 编码</div>
                <div className="col-span-2">录入类型</div>
                <div className="col-span-3">用途</div>
                <div className="col-span-2 text-right">预设值</div>
                <div className="col-span-1"></div>
              </div>
              
              {filteredAttributes.map(attr => (
                <div 
                  key={attr.id} 
                  className="grid grid-cols-12 items-center p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all group"
                >
                  <div className="col-span-4 flex flex-col">
                    <span className="font-medium text-slate-200">{attr.name}</span>
                    <span className="text-xs text-slate-500 font-mono">{attr.code}</span>
                  </div>
                  
                  <div className="col-span-2 flex items-center gap-2 text-slate-400 text-sm capitalize">
                    {getTypeIcon(attr.type)}
                    <span>
                        {attr.type === 'multi_select' ? 'User Select (Multi)' : 
                         attr.type === 'select' ? 'User Select (Single)' : attr.type}
                    </span>
                  </div>

                  <div className="col-span-3 flex gap-2 flex-wrap">
                    {attr.isSalesAttribute && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] h-5">
                            销售规格 (SKU)
                        </Badge>
                    )}
                    {attr.isFilterable && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px] h-5">
                            筛选器
                        </Badge>
                    )}
                    {attr.isRequired && (
                        <Badge variant="outline" className="text-slate-400 border-slate-700 text-[10px] h-5">
                            必填
                        </Badge>
                    )}
                  </div>

                  <div className="col-span-2 text-right text-slate-400 text-sm">
                    {attr.values.length > 0 ? (
                        <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                            {attr.values.length} 个选项
                        </Badge>
                    ) : (
                        <span className="text-slate-600">-</span>
                    )}
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(attr)}>
                        <Edit2 size={14} className="text-slate-400 hover:text-white" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Editor */}
        {showEditor && (
             <Card className="col-span-4 bg-[#1e293b] border-slate-700 flex flex-col animate-in slide-in-from-right-4">
                <CardHeader>
                    <CardTitle>{editingAttribute ? '编辑属性' : '新建属性'}</CardTitle>
                    <CardDescription>
                        定义属性的类型与取值范围
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                        <Label>属性名称</Label>
                        <Input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="例如：材质"
                            className="bg-slate-900 border-slate-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>属性编码 (Code)</Label>
                        <Input 
                            value={formData.code}
                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                            placeholder="例如：material"
                            className="bg-slate-900 border-slate-700 font-mono text-sm"
                            disabled={!!editingAttribute} // Lock code on edit usually
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>录入方式</Label>
                        <select 
                            className="w-full flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value as AttributeType})}
                        >
                            <option value="text">文本输入 (Manual Input)</option>
                            <option value="select">单选 (Single Select)</option>
                            <option value="multi_select">多选 (Multi Select)</option>
                            <option value="boolean">是/否 (Boolean)</option>
                            <option value="date">日期 (Date)</option>
                        </select>
                    </div>

                    {/* Options Editor for Select types */}
                    {(formData.type === 'select' || formData.type === 'multi_select') && (
                        <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">预设选项值</Label>
                            <div className="flex gap-2">
                                <Input 
                                    className="h-8 bg-slate-800 border-slate-700" 
                                    placeholder="输入选项值..."
                                    value={newValueInput}
                                    onChange={(e) => setNewValueInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
                                />
                                <Button size="sm" variant="secondary" onClick={handleAddValue} className="h-8">
                                    <Plus size={14} />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto">
                                {formData.values?.map(val => (
                                    <Badge key={val.id} variant="outline" className="bg-slate-800 pl-2 pr-1 py-1 flex gap-1 items-center border-slate-700">
                                        {val.label}
                                        <div 
                                            className="cursor-pointer hover:bg-slate-700 rounded-full p-0.5"
                                            onClick={() => handleRemoveValue(val.id)}
                                        >
                                            <Trash2 size={10} className="text-slate-500 hover:text-red-400" />
                                        </div>
                                    </Badge>
                                ))}
                                {formData.values?.length === 0 && (
                                    <span className="text-xs text-slate-600">暂无选项</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        <Label>属性特性</Label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 rounded bg-slate-900/30">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">销售属性 (Sales Attribute)</span>
                                    <span className="text-[10px] text-slate-500">用于生成 SKU 规格 (如颜色/尺码)</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600"
                                    checked={formData.isSalesAttribute}
                                    onChange={(e) => setFormData({...formData, isSalesAttribute: e.target.checked})}
                                />
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-slate-900/30">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">用于筛选 (Filterable)</span>
                                    <span className="text-[10px] text-slate-500">在前台分类页作为筛选条件</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600"
                                    checked={formData.isFilterable}
                                    onChange={(e) => setFormData({...formData, isFilterable: e.target.checked})}
                                />
                            </div>
                             <div className="flex items-center justify-between p-2 rounded bg-slate-900/30">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">展示属性 (Display Attribute)</span>
                                    <span className="text-[10px] text-slate-500">仅在商品参数表中展示，不参与销售或筛选</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600"
                                    checked={!formData.isSalesAttribute && !formData.isFilterable}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <div className="p-4 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-[#1e293b]">
                    <Button variant="ghost" onClick={() => setShowEditor(false)}>取消</Button>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">保存</Button>
                </div>
             </Card>
        )}
      </div>
    </div>
  );
}
