"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Info,
  DollarSign,
  Package,
  Layers,
  Image as ImageIcon,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter, 
  AlignRight,
  Link as LinkIcon,
  Smile,
  Type,
  Loader2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/contexts/ToastContext';
import { AICreateDialog } from '@/components/ecommerce/AICreateDialog';

// --- Mock Data ---

// Categories with hierarchy
interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
}

const CATEGORY_TREE: Category[] = [
  { 
     id: '1', name: '女士服装', parentId: null, children: [
        { id: '11', name: '连衣裙', parentId: '1' },
        { id: '12', name: '上衣', parentId: '1', children: [
           { id: '121', name: 'T恤', parentId: '12' },
           { id: '122', name: '衬衫', parentId: '12' }
        ]},
     ]
  },
  { 
     id: '2', name: '男士服装', parentId: null, children: [
        { id: '21', name: '外套', parentId: '2' },
        { id: '22', name: '裤装', parentId: '2' }
     ]
  },
];

// Mock Attributes for a specific category (e.g. Clothes)
const MOCK_ATTRIBUTES = [
  { id: 'attr_1', name: '颜色', type: 'select', values: ['黑色', '白色', '红色', '蓝色'] },
  { id: 'attr_2', name: '尺码', type: 'select', values: ['S', 'M', 'L', 'XL'] },
  { id: 'attr_3', name: '材质', type: 'multi_select', values: ['棉', '麻', '聚酯纤维', '真丝'] },
  { id: 'attr_4', name: '适用季节', type: 'select', values: ['春季', '夏季', '秋季', '冬季'] },
];

export default function CreateProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState('basic');
  const [categories, setCategories] = useState<Category[]>([]); // Real categories

  useEffect(() => {
    // 1. Fetch Categories
    const fetchCategories = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/v1/categories/tree');
            if (res.ok) {
                setCategories(await res.json());
            }
        } catch (e) {
            console.error("Failed to load categories", e);
        }
    };
    fetchCategories();

    // 2. Fetch Product if editing
    const id = searchParams.get('id');
    if (!id) return;

    const fetchProduct = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/products/${id}`, {
                cache: 'no-store'
            });
            
            if (res.ok) {
                const product = await res.json();
                
                setBasicInfo({
                    name: product.name,
                    subtitle: product.subtitle || '', 
                    categoryId: product.category_id ? String(product.category_id) : '',
                    price: String(product.price || 0),
                    stock: String(product.stock_quantity || 0),
                    spuCode: product.spu_code,
                    skuCode: product.sku_code
                });
                
                // Need to check what state setter is available for description
                // Based on previous read, it seems setDescription is used
                setDescription(product.description || '');
                setImages(product.images || []);
                
                // Split attributes into Mock vs Custom
                const allSpecs = product.attributes || {};
                // attributes from DB often come as { "color": "red" } or { "attr_1": "val" }
                // The UI expects MOCK_ATTRIBUTES IDs (attr_1, attr_2...) for known specs
                
                const mockIds = new Set(MOCK_ATTRIBUTES.map(a => a.id));
                const knownSpecs: Record<string, any> = {};
                const extraSpecs: {id: string; name: string; value: string}[] = [];
                
                Object.entries(allSpecs).forEach(([key, val]) => {
                    if (mockIds.has(key)) {
                        knownSpecs[key] = val;
                    } else {
                        // If key matches the NAME of a mock attribute (e.g. "颜色" matches "attr_1"), map it
                        const mockAttr = MOCK_ATTRIBUTES.find(a => a.name === key);
                        if (mockAttr) {
                            knownSpecs[mockAttr.id] = val;
                        } else {
                            extraSpecs.push({ id: String(Date.now() + Math.random()), name: key, value: String(val) });
                        }
                    }
                });

                setProductSpecs(knownSpecs);
                setCustomSpecs(extraSpecs);
            }
        } catch (e) {
            console.error("Failed to load product from API", e);
            showToast('Failed to load product details', 'error');
        }
    };

    fetchProduct();

  }, [searchParams, showToast]);

  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Handle AI Data Import
  const handleAIFill = (data: any) => {
      setBasicInfo({
          name: data.name,
          subtitle: data.subtitle,
          categoryId: data.categoryId,
          price: data.price,
          stock: data.stock
      });
      setImages(data.images);
      
      // AI returns specs like { "颜色": "红色" } which are human readable names, rarely matching 'attr_1'
      // We'll try to map to mock attributes if names match, otherwise custom.
      const aiSpecs = data.specs || {};
      const knownSpecs: Record<string, any> = {};
      const extraSpecs: {id: string; name: string; value: string}[] = [];

      Object.entries(aiSpecs).forEach(([key, val]) => {
          const match = MOCK_ATTRIBUTES.find(a => a.name === key);
          if (match) {
              knownSpecs[match.id] = val;
          } else {
              extraSpecs.push({ id: Date.now() + key, name: key, value: String(val) });
          }
      });

      setProductSpecs(knownSpecs);
      setCustomSpecs(extraSpecs);
      setDescription(data.description);
      
      setShowAIModal(false);
      showToast('商品信息已自动填充', 'success');
  };

  // Basic Info State
  const [basicInfo, setBasicInfo] = useState<{
      name: string;
      subtitle: string;
      categoryId: string;
      price: string;
      stock: string;
      spuCode?: string;
      skuCode?: string;
  }>({
    name: '',
    subtitle: '',
    categoryId: '',
    price: '',
    stock: ''
  });
  const [description, setDescription] = useState('');

  // Helper for Toolbar
  const insertMarkdown = (pre: string, post = '') => {
        const textarea = document.querySelector('textarea#desc-editor') as HTMLTextAreaElement;
        if (!textarea) {
            // Fallback if ref not set or found
            setDescription(prev => prev + pre + "Text" + post);
            return;
        }
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);
        
        const newText = before + pre + (selection || 'Text') + post + after;
        setDescription(newText);
        
        // Restore focus next tick
        setTimeout(() => {
            textarea.focus();
            const newCursor = start + pre.length + (selection || 'Text').length + post.length;
            textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
   };

  // Specs State
  const [productSpecs, setProductSpecs] = useState<Record<string, string | string[]>>({});
  // Track custom added specs {name: "", value: ""}
  const [customSpecs, setCustomSpecs] = useState<{id: string, name: string, value: string}[]>([]);

  const addCustomSpec = () => {
    setCustomSpecs(prev => [...prev, { id: Date.now().toString(), name: '', value: '' }]);
  };
  
  const updateCustomSpec = (id: string, field: 'name' | 'value', val: string) => {
    setCustomSpecs(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
    // Also sync to main spec object if needed, or just submit them merged later
  };

  const removeCustomSpec = (id: string) => {
    setCustomSpecs(prev => prev.filter(s => s.id !== id));
  };
  const [skuList, setSkuList] = useState<any[]>([]);

  // Function to flatten category tree for select options with indentation
  const renderCategoryOptions = (categories: Category[], level = 0) => {
    return categories.map(cat => (
        <React.Fragment key={cat.id}>
            <option value={cat.id}>
                {'\u00A0\u00A0'.repeat(level * 2)} {cat.name}
            </option>
            {cat.children && renderCategoryOptions(cat.children, level + 1)}
        </React.Fragment>
    ));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/v1/files/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setImages([...images, data.url]);
            showToast('图片上传成功', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('图片上传失败', 'error');
        }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const setMainImage = (index: number) => {
      if (index === 0) return;
      const newImages = [...images];
      const [moved] = newImages.splice(index, 1);
      newImages.unshift(moved);
      setImages(newImages);
      showToast("主图设置成功", 'success');
  };

  const nameInputRef = React.useRef<HTMLInputElement>(null);

  const handleSpecChange = (attrId: string, value: string) => {
      setProductSpecs(prev => ({ ...prev, [attrId]: value }));
  };

  // Steps Navigation Data
  const STEPS = [
      { id: 'basic', label: '1. 基础信息' },
      { id: 'media', label: '2. 商品图片' },
      { id: 'specs', label: '3. 规格属性' },
      { id: 'detail', label: '4. 商品详情' },
  ];

  const handleScrollToStart = (id: string) => {
      setActiveSection(id);
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (isDraft: boolean) => {
      // Basic Validation
      if (!basicInfo.name) {
          showToast('请输入商品标题', 'error');
          handleScrollToStart('basic');
          // Focus name input
          setTimeout(() => nameInputRef.current?.focus(), 100);
          return;
      }
      
      try {
          // Check for duplicate name
          const checkRes = await fetch(`http://127.0.0.1:8000/api/v1/products/?limit=1000`);
          if (checkRes.ok) {
              const allProducts: any[] = await checkRes.json();
              const editId = Number(searchParams.get('id'));
              const duplicate = allProducts.find(p => p.name.trim() === basicInfo.name.trim() && p.id !== editId);
              
              if (duplicate) {
                  showToast('商品名称不能重复，请修改', 'error');
                  handleScrollToStart('basic');
                  // Highlight and Focus name input
                  if (nameInputRef.current) {
                      nameInputRef.current.focus();
                      nameInputRef.current.classList.add('ring-2', 'ring-red-500', 'border-red-500');
                      setTimeout(() => nameInputRef.current?.classList.remove('ring-2', 'ring-red-500', 'border-red-500'), 3000);
                  }
                  return;
              }
          }
      } catch (e) {
          console.error("Failed to check duplicate name", e);
      }

      if (!basicInfo.categoryId) {
          showToast('请选择商品分类', 'error');
          handleScrollToStart('basic');
          return;
      }

      setIsSubmitting(true);

      try {
          const editId = searchParams.get('id');
          
          // Merge standard specs and custom specs
          const mergedAttributes = { ...productSpecs };
          customSpecs.forEach(s => {
              if (s.name && s.value) {
                  mergedAttributes[s.name] = s.value; // Use name as key for custom attributes
              }
          });

          // Construct Product Object
          const productPayload: any = {
              spu_code: basicInfo.spuCode || `SPU-${Date.now()}`,
              sku_code: basicInfo.skuCode || `SKU-${Math.floor(Math.random() * 10000)}`,
              name: basicInfo.name,
              price: parseFloat(basicInfo.price) || 0,
              stock_quantity: parseInt(basicInfo.stock) || 0,
              description: description,
              category_id: basicInfo.categoryId ? parseInt(basicInfo.categoryId) : null,
              attributes: mergedAttributes,
              images: images.length > 0 ? images : ["/placeholder.jpg"],
              status: isDraft ? 'draft' : 'published',
          };

          let endpoint = 'http://127.0.0.1:8000/api/v1/products/';
          let method = 'POST';

          if (editId) {
             endpoint = `http://127.0.0.1:8000/api/v1/products/${editId}`;
             method = 'PUT';
             // Keep existing codes if editing
             if (basicInfo.spuCode) productPayload.spu_code = basicInfo.spuCode;
             if (basicInfo.skuCode) productPayload.sku_code = basicInfo.skuCode;
          }

          const response = await fetch(endpoint, {
              method: method,
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(productPayload),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || 'Failed to save product');
          }

          showToast(isDraft ? '草稿已保存' : '发布成功', 'success');
          
          // Redirect after delay
          setTimeout(() => {
              router.push('/ecommerce/products');
          }, 1000);
      } catch (error) {
          console.error('Failed to save product:', error);
          showToast('操作失败，请重试', 'error');
          setIsSubmitting(false);
      }
  };

  return (
    <div className="flex flex-col space-y-6 w-full pb-20 relative">
      
      {/* Top Navigation Bar (Replacing Sidebar Nav) */}
      <div className="sticky top-0 z-40 bg-[rgb(15,23,42)] pt-4 pb-2 border-b border-slate-800/80 mb-4 shadow-xl backdrop-blur-sm px-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                         {basicInfo.name || "发布新商品"}
                    </h1>
                    {searchParams.get('id') && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
                                正在编辑 ID: {searchParams.get('id')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex gap-3">
                <Button 
                    className="bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/30"
                    onClick={() => setShowAIModal(true)}
                >
                    <Sparkles size={16} className="mr-2" />
                    AI 智能一键发布
                </Button>
                <div className="w-px h-8 bg-slate-800 mx-1"></div>
                <Button 
                    variant="ghost" 
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    存为草稿
                </Button>
                <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
                    立即发布
                </Button>
            </div>
        </div>

        {/* Notifications */}
        
        {/* Process Steps */}
        <div className="w-full mx-auto">
            <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10 transform -translate-y-1/2"></div>
                
                {STEPS.map((step, index) => {
                    const isActive = activeSection === step.id;
                    const isCompleted = STEPS.findIndex(s => s.id === activeSection) > index;
                    
                    return (
                        <button 
                            key={step.id}
                            onClick={() => handleScrollToStart(step.id)}
                            className={`flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-[rgb(var(--background))] border-2 ${isActive ? 'border-indigo-500 text-indigo-400' : isCompleted ? 'border-indigo-900/50 text-indigo-300' : 'border-slate-800 text-slate-500'}`}
                        >
                            <span className={`text-sm font-medium ${isActive ? 'text-indigo-400' : ''}`}>
                                {step.label}
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-between mt-2 px-8">
                 {/* Arrows illustration - CSS Pseudo elements or simple SVGs could also work for arrows between steps */}
            </div>
        </div>
      </div>

      <div className="w-full mx-auto space-y-8 px-8">
            
            {/* 1. Basic Info */}
            <section id="basic" className="scroll-mt-40 animate-in fade-in slide-in-from-bottom-4">
                <Card className="bg-[#1e293b]/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Info size={18} className="text-indigo-400" /> 
                            基础信息
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-2">
                                <Label>商品标题 <span className="text-red-400">*</span></Label>
                                <Input 
                                    ref={nameInputRef}
                                    placeholder="请输入商品名称（建议包含品牌、品类、核心特征）" 
                                    className="bg-slate-900 border-slate-700 transition-all font-medium text-lg"
                                    value={basicInfo.name}
                                    onChange={e => setBasicInfo({...basicInfo, name: e.target.value})}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>商品副标题/卖点</Label>
                                <Input 
                                    placeholder="例如：2024新款 / 纯棉透气 / 宽松百搭" 
                                    className="bg-slate-900 border-slate-700"
                                    value={basicInfo.subtitle}
                                    onChange={e => setBasicInfo({...basicInfo, subtitle: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>所属分类 <span className="text-red-400">*</span></Label>
                                <select 
                                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                                    value={basicInfo.categoryId}
                                    onChange={e => setBasicInfo({...basicInfo, categoryId: e.target.value})}
                                >
                                    <option value="">请选择分类</option>
                                    {renderCategoryOptions(categories)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800/50">
                             <div className="space-y-2">
                                <Label>一口价 (¥)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input className="pl-9 bg-slate-900 border-slate-700" placeholder="0.00" value={ basicInfo.price } onChange={e => setBasicInfo({...basicInfo, price: e.target.value})} />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <Label>库存数量</Label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input className="pl-9 bg-slate-900 border-slate-700" placeholder="0" value={ basicInfo.stock } onChange={e => setBasicInfo({...basicInfo, stock: e.target.value})} />
                                </div>
                             </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* 2. Images */}
            <section id="media" className="scroll-mt-40 animate-in fade-in slide-in-from-bottom-4">
                <Card className="bg-[#1e293b]/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ImageIcon size={18} className="text-indigo-400" /> 
                            商品图库
                        </CardTitle>
                        <CardDescription>第一张图片将作为商品主图</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="group relative aspect-square rounded-lg border border-slate-700 overflow-hidden bg-slate-900">
                                    <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        <Button variant="destructive" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/80" onClick={() => removeImage(idx)}>
                                            <Trash2 size={14} />
                                        </Button>
                                        {idx !== 0 && (
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                className="h-6 text-[10px] px-2 bg-indigo-600/80 hover:bg-indigo-600 text-white border-0" 
                                                onClick={() => setMainImage(idx)}
                                            >
                                                设为主图
                                            </Button>
                                        )}
                                    </div>
                                    {idx === 0 && (
                                        <div className="absolute top-0 left-0 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-br">
                                            主图
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            <label className="aspect-square rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/30 hover:bg-slate-800/50 hover:border-slate-500 transition-all flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-300">
                                <Upload size={24} className="mb-2" />
                                <span className="text-xs">上传图片</span>
                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                            </label>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* 3. Specs */}
            <section id="specs" className="scroll-mt-40 animate-in fade-in slide-in-from-bottom-4">
                <Card className="bg-[#1e293b]/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Layers size={18} className="text-indigo-400" /> 
                            规格与属性
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {basicInfo.categoryId ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    {MOCK_ATTRIBUTES.map(attr => (
                                        <div key={attr.id} className="space-y-2">
                                            <Label>{attr.name}</Label>
                                            {attr.type === 'select' ? (
                                                <select 
                                                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                                                    onChange={e => handleSpecChange(attr.id, e.target.value)}
                                                    // Add selected value here
                                                    value={productSpecs[attr.id] as string || ''}
                                                >
                                                    <option value="">请选择{attr.name}</option>
                                                    {attr.values.map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            ) : attr.type === 'multi_select' ? (
                                                <div className="flex flex-wrap gap-2 p-3 border border-slate-700 rounded-md bg-slate-900">
                                                    {attr.values.map(v => (
                                                        <label key={v} className="flex items-center gap-2 cursor-pointer bg-slate-800 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700">
                                                            <input type="checkbox" className="rounded border-slate-600 bg-slate-900 text-indigo-500" />
                                                            <span className="text-sm">{v}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Input className="bg-slate-900 border-slate-700" placeholder={`输入${attr.name}`} />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Custom Specs List */}
                                <div className="space-y-3 pt-4 border-t border-slate-800">
                                    <h4 className="text-sm font-medium text-slate-300">自定义规格</h4>
                                    {customSpecs.map((spec, idx) => (
                                        <div key={spec.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                                            <Input 
                                                className="bg-slate-900 border-slate-700 w-1/3" 
                                                placeholder="规格名 (如: 风格)" 
                                                value={spec.name}
                                                onChange={e => updateCustomSpec(spec.id, 'name', e.target.value)}
                                            />
                                            <Input 
                                                className="bg-slate-900 border-slate-700 flex-1" 
                                                placeholder="规格值 (如: 复古)" 
                                                value={spec.value}
                                                onChange={e => updateCustomSpec(spec.id, 'value', e.target.value)}
                                            />
                                            <Button variant="ghost" size="icon" className="hover:text-red-400" onClick={() => removeCustomSpec(spec.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 p-4 bg-slate-900/50 rounded flex justify-center">
                                    <Button variant="outline" className="text-indigo-400 border-indigo-900 hover:bg-indigo-900/20" onClick={addCustomSpec}>
                                        <Plus size={14} className="mr-2" />
                                        添加自定义规格
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-slate-900/30 rounded border border-slate-800 border-dashed text-center text-slate-500">
                                <Layers size={32} className="mx-auto mb-3 opacity-30" />
                                <p>请先在“基础信息”中选择商品分类，</p>
                                <p className="text-xs">系统将自动加载该分类下的规格模板。</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* 4. Details */}
            <section id="detail" className="scroll-mt-40 animate-in fade-in slide-in-from-bottom-4">
                <Card className="bg-[#1e293b]/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg">商品详情</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col border border-slate-700 rounded-md bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                            {/* Rich Text Editor Toolbar */}
                            <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 bg-slate-950/50 p-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Bold" 
                                    onClick={() => insertMarkdown('**', '**')}>
                                    <Bold size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Italic"
                                    onClick={() => insertMarkdown('*', '*')}>
                                    <Italic size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Underline"
                                    onClick={() => insertMarkdown('__', '__')}>
                                    <Underline size={16} />
                                </Button>
                                <div className="w-px h-5 bg-slate-700 mx-1"></div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Heading"
                                    onClick={() => insertMarkdown('## ', '\n')}>
                                    <Type size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Bullet List"
                                    onClick={() => insertMarkdown('- ', '\n')}>
                                    <List size={16} />
                                </Button>
                                <div className="w-px h-5 bg-slate-700 mx-1"></div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Insert Link"
                                    onClick={() => insertMarkdown('[Link Text](', ') ')}>
                                    <LinkIcon size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-slate-200" title="Insert Image"
                                    onClick={() => insertMarkdown('![Image Alt](', ') ')}>
                                    <ImageIcon size={16} />
                                </Button>
                            </div>
                            
                            {/* Editor Content Area (Borderless) */}
                            <textarea 
                                id="desc-editor"
                                placeholder="请输入商品详细描述... 支持 Markdown 格式" 
                                className="w-full min-h-[400px] p-4 bg-transparent border-none text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-0 resize-y font-mono text-sm leading-relaxed"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </section>

      </div>

      <AICreateDialog 
        isOpen={showAIModal} 
        onClose={() => setShowAIModal(false)} 
        onSuccess={handleAIFill}
      />
    </div>
  );
}
