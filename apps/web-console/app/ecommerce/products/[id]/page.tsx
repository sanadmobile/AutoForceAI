'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    Package, 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Tag, 
    Layers, 
    DollarSign, 
    Archive,
    Calendar,
    CheckCircle2,
    XCircle,
    Copy,
    Share2,
    Globe,
    ExternalLink,
    AlignLeft
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/contexts/ToastContext';

interface Category {
    id: number;
    name: string;
    parent_id?: number | null;
    children?: Category[];
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const [product, setProduct] = useState<any>(null);
    const [flattenedCategories, setFlattenedCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Fetch Categories for name lookup
    const fetchCategories = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/v1/categories/tree');
            if (res.ok) {
                const data = await res.json();
                
                // Helper to flatten
                const flatten = (cats: Category[]): Category[] => {
                    let flat: Category[] = [];
                    cats.forEach(c => {
                        flat.push({ id: c.id, name: c.name, parent_id: c.parent_id });
                        if (c.children && c.children.length > 0) {
                            flat = flat.concat(flatten(c.children));
                        }
                    });
                    return flat;
                };
                
                setFlattenedCategories(flatten(data));
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchProduct = async () => {
        if (!params.id) return;
        
        try {
            setLoading(true);
            const res = await fetch(`http://127.0.0.1:8000/api/v1/products/${params.id}`);
            
            if (!res.ok) {
                if (res.status === 404) {
                    showToast("找不到该商品", "error");
                    router.push('/ecommerce/products');
                    return;
                }
                throw new Error("Failed to fetch product");
            }

            const data = await res.json();
            setProduct(data);
            if (data.images && data.images.length > 0) {
                setActiveImage(data.images[0]);
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            showToast("加载商品详情失败", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchProduct();
    }, [params.id]);

    const handleCopyId = () => {
        if (product?.id) {
            navigator.clipboard.writeText(product.id.toString());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            showToast("商品ID已复制", "success");
        }
    };

    const handleDelete = async () => {
        if (!confirm("确定要删除这个商品吗？此操作无法撤销。")) return;
        
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/products/${product.id}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                showToast("商品已删除", "success");
                router.push('/ecommerce/products');
            } else {
                showToast("删除失败", "error");
            }
        } catch (error) {
            console.error("Delete failed", error);
            showToast("删除请求失败", "error");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-950 text-slate-400">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    <p>加载详情中...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return null; 
    }

    const categoryName = flattenedCategories.find(c => c.id === product.category_id)?.name || '未分类';
    const isPublished = product.status === 'published';

    return (
        <div className="h-full overflow-y-auto bg-slate-950 text-slate-200">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.push('/ecommerce/products')}
                        className="text-slate-400 hover:text-white hover:bg-white/5"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-white tracking-tight">{product.name}</h1>
                            <Badge variant="outline" className={`
                                ${isPublished ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'}
                            `}>
                                {isPublished ? '已发布' : '草稿'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">ID: {product.id} 
                                <button onClick={handleCopyId} className="hover:text-indigo-400 transition-colors">
                                    {copied ? <CheckCircle2 size={10} className="text-emerald-500"/> : <Copy size={10} />}
                                </button>
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={10} /> 创建于 {new Date(product.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <Globe size={10} /> {categoryName}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        onClick={() => window.open(`/preview/product/${product.id}`, '_blank')} // Assuming there is a preview page, or just placeholder
                        disabled
                        title="前台预览 (暂未实现)"
                    >
                        <ExternalLink size={16} className="mr-2" /> 预览
                    </Button>
                    <div className="w-[1px] h-6 bg-slate-800" />
                    <Button 
                        variant="destructive" 
                        onClick={handleDelete}
                        className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                    >
                        <Trash2 size={16} className="mr-2" /> 删除
                    </Button>
                    <Link href={`/ecommerce/products/create?id=${product.id}`}>
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            <Edit size={16} className="mr-2" /> 编辑商品
                        </Button>
                    </Link>
                </div>
            </div>

            <main className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Images */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="aspect-square bg-slate-900 rounded-2xl border border-white/10 overflow-hidden relative group">
                            {activeImage ? (
                                <img 
                                    src={activeImage} 
                                    alt={product.name} 
                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                                    <Package size={64} strokeWidth={1} />
                                    <span className="text-sm mt-4 font-mono">No Image</span>
                                </div>
                            )}
                        </div>
                        
                        {product.images && product.images.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {product.images.map((img: string, idx: number) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`
                                            aspect-square rounded-lg border overflow-hidden relative
                                            ${activeImage === img ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-white/10 hover:border-white/30'}
                                        `}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Price & Stock Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="p-5">
                                    <div className="text-slate-500 text-xs font-medium uppercase mb-1">价格 (Price)</div>
                                    <div className="text-2xl font-bold text-white flex items-baseline">
                                        <span className="text-sm mr-1">¥</span>{product.price}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="p-5">
                                    <div className="text-slate-500 text-xs font-medium uppercase mb-1">库存 (Stock)</div>
                                    <div className="text-2xl font-bold text-white">{product.stock_quantity}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="p-5">
                                    <div className="text-slate-500 text-xs font-medium uppercase mb-1">SPU Code</div>
                                    <div className="text-lg font-mono text-slate-300 truncate" title={product.spu_code}>
                                        {product.spu_code || '-'}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900/50 border-slate-800">
                                <CardContent className="p-5">
                                    <div className="text-slate-500 text-xs font-medium uppercase mb-1">SKU Code</div>
                                    <div className="text-lg font-mono text-slate-300 truncate" title={product.sku_code}>
                                        {product.sku_code || '-'}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Description */}
                        <Card className="bg-slate-900/30 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base text-slate-300 flex items-center gap-2">
                                    <AlignLeft size={16} /> 商品详情
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="prose prose-invert max-w-none text-slate-400 text-sm leading-relaxed">
                                {product.description ? (
                                    <div className="whitespace-pre-wrap">{product.description}</div>
                                ) : (
                                    <span className="italic text-slate-600">暂无描述</span>
                                )}
                            </CardContent>
                        </Card>

                        {/* Attributes / Specs */}
                        <Card className="bg-slate-900/30 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base text-slate-300 flex items-center gap-2">
                                    <Layers size={16} /> 规格属性
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {product.attributes && Object.keys(product.attributes).length > 0 ? (
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                        {Object.entries(product.attributes).map(([key, value]: any) => (
                                            <div key={key} className="flex justify-between items-center border-b border-white/5 pb-2">
                                                <span className="text-slate-500 text-sm">{key}</span>
                                                <span className="text-slate-200 font-medium text-sm text-right">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-600 text-sm">
                                        未设置规格属性
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
