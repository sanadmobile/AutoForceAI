"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, 
    Search,
    Loader2,
    RefreshCw,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Folder,
    Eye
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Product {
    id: number;
    spu_code: string;
    sku_code: string;
    name: string;
    category_id?: number;
    price: number;
    stock_quantity: number;
    description: string;
    attributes: any;
    images: string[];
    embedding_status: 'pending' | 'embedded' | 'failed';
    status?: 'draft' | 'published';
    created_at: string;
}

interface Category {
    id: number;
    name: string;
    children?: Category[];
}

const flattenCategories = (cats: Category[]) => {
    const result: {id: number, name: string}[] = [];
    const traverse = (list: Category[]) => {
        for (const cat of list) {
            result.push({ id: cat.id, name: cat.name });
            if (cat.children) traverse(cat.children);
        }
    };
    traverse(cats);
    return result;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const flattenedCategories = React.useMemo(() => flattenCategories(categories), [categories]);
    
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);

    // Search & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    const router = useRouter();


    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Fetch directly from the backend service
            // Fetch category tree instead of list to get full nested data, then flatten
            const [prodRes, catRes] = await Promise.all([
                 fetch('http://127.0.0.1:8000/api/v1/products/?limit=100', { cache: 'no-store' }),
                 fetch('http://127.0.0.1:8000/api/v1/categories/tree', { cache: 'no-store' })
            ]);

            if (catRes.ok) {
                const cats = await catRes.json();
                setCategories(cats);
            }

            if (prodRes.ok) {
                const data = await prodRes.json();
                console.log("Products loaded:", data.length);
                
                const mappedProducts = data.map((p: any) => ({
                    id: p.id,
                    spu_code: p.spu_code,
                    sku_code: p.sku_code,
                    name: p.name,
                    category_id: p.category_id,
                    price: Number(p.price),
                    stock_quantity: p.stock_quantity,
                    description: p.description,
                    attributes: p.attributes,
                    images: p.images || [],
                    embedding_status: p.embedding_status,
                    status: p.status || 'draft',
                    created_at: p.created_at
                }));

                setProducts(mappedProducts);
            } else {
                console.error("Backend returned status:", prodRes.status);
            }
        } catch (error) {
            console.error("API fetch failed:", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchProducts();
    };

    // Filter Logic
    const filteredProducts = products.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || 
               p.sku_code.toLowerCase().includes(q) ||
               (p.status || '').toLowerCase().includes(q);
    });

    // Pagination Logic
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-slate-950">
            {/* Image Hover Preview */}
            {hoveredImage && (
                <div 
                    className="fixed z-[9999] pointer-events-none rounded-xl overflow-hidden shadow-2xl border-2 border-indigo-500/50 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100 origin-center"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '400px',
                        height: 'auto'
                    }}
                >
                     <img src={hoveredImage} alt="Preview" className="w-full h-auto object-contain" />
                </div>
            )}

            {/* Header Section - Sticky & Compact */}
            <div className="flex-none p-4 pb-2 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0f172a] z-20">
                <div className="flex items-center gap-4 flex-1">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex-none">
                       商品管理
                    </h1>
                    
                    {/* Inline Search */}
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            placeholder="搜索商品名称、SKU、状态..."
                            className="w-full pl-9 h-9 bg-white/5 border border-white/10 rounded-md text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1); // Reset to page 1 on search
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                     <button 
                         onClick={handleRefresh}
                         className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                         title="Refresh"
                    >
                        <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={() => router.push('/ecommerce/products/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        <Plus size={16} /> 发布新品
                    </button>
                </div>
            </div>

            {/* Main Content Area - Full Height Table */}
            <div className="flex-1 overflow-hidden p-4 pt-0 flex flex-col">
                <div className="flex-1 border border-white/5 bg-[#0f172a]/40 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col relative w-full h-full">
                     {loading ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 gap-2">
                            <Loader2 className="animate-spin" size={20} /> 加载商品数据...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                            <Image src="/logo.png" width={40} height={40} alt="Empty" className="opacity-20 mb-4 grayscale" />
                            <p>暂无商品数据</p>
                        </div>
                    ) : (
                        <>
                        <div className="flex-1 overflow-auto relative w-full">
                            <table className="w-full text-left text-sm relative border-separate border-spacing-0">
                                <thead className="text-slate-400 font-medium sticky top-0 z-10 bg-[#0f172a] shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 border-b border-white/10 font-semibold text-slate-300">商品信息</th>
                                        <th className="px-6 py-3 border-b border-white/10 font-semibold text-slate-300">价格/库存</th>
                                        <th className="px-6 py-3 border-b border-white/10 font-semibold text-slate-300">商品属性</th>
                                        <th className="px-6 py-3 border-b border-white/10 font-semibold text-slate-300">状态</th>
                                        <th className="px-6 py-3 text-right border-b border-white/10 font-semibold text-slate-300">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-slate-900/20">
                                    {paginatedProducts.length > 0 ? paginatedProducts.map((product) => (
                                        <tr 
                                            key={product.id} 
                                            className="group transition-all duration-200 hover:bg-blue-500/10 hover:shadow-[inset_0_0_0_1px_#3b82f6] relative hover:z-10"
                                        >
                                            <td className="px-6 py-4 border-b border-white/5 group-hover:border-transparent">
                                                <div className="flex items-center gap-4">
                                                    <div 
                                                        className="w-12 h-16 bg-slate-800 rounded-md flex items-center justify-center overflow-hidden border border-white/10 relative group/img cursor-pointer shrink-0"
                                                        onMouseEnter={() => setHoveredImage(product.images?.[0] || null)}
                                                        onMouseLeave={() => setHoveredImage(null)}
                                                        onClick={() => router.push(`/ecommerce/products/create?id=${product.id}`)}
                                                    >
                                                        {product.images && product.images.length > 0 && product.images[0] ? (
                                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transform group-hover/img:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <span className="font-serif text-2xl text-slate-600">{product.name?.[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div 
                                                            className="font-bold text-slate-200 mb-1 truncate max-w-[240px] cursor-pointer hover:text-indigo-400 hover:underline" 
                                                            title={product.name}
                                                            onClick={() => router.push(`/ecommerce/products/create?id=${product.id}`)}
                                                        >
                                                            {product.name}
                                                        </div>
                                                        {product.category_id && (
                                                            <div className="inline-flex items-center gap-1.5 text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded mb-1">
                                                                <Folder size={10} />
                                                                {flattenedCategories.find(c => c.id === product.category_id)?.name || `ID: ${product.category_id}`}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                                                            {product.sku_code}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-b border-white/5">
                                                <div className="text-slate-200 font-medium">¥{product.price}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">库存: {product.stock_quantity}</div>
                                            </td>
                                            <td className="px-6 py-4 border-b border-white/5">
                                                <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                                                    {product.attributes && Object.entries(product.attributes).slice(0, 3).map(([key, val]: any) => (
                                                        <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300">
                                                            <span className="opacity-70 mr-1 text-blue-400">{key}:</span> {val}
                                                        </span>
                                                    ))}
                                                    {product.attributes && Object.keys(product.attributes).length > 3 && (
                                                        <span className="text-[10px] text-slate-500 self-center">+{Object.keys(product.attributes).length - 3}</span>
                                                    )}
                                                    {(!product.attributes || Object.keys(product.attributes).length === 0) && (
                                                        <span className="text-xs text-slate-600 italic">No attributes</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-b border-white/5">
                                                 <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                                    product.status === 'draft' 
                                                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                                                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                }`}>
                                                    {product.status === 'draft' ? '草稿' : '已发布'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right border-b border-white/5">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => router.push(`/ecommerce/products/create?id=${product.id}`)}
                                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="编辑"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="删除"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            alert("Delete operation requires backend API implementation.");
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-slate-500">
                                                没有找到匹配的商品
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0f172a] shrink-0">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>
                                    显示 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, totalItems)} 条，共 {totalItems} 条
                                </span>
                                <select 
                                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
                                    value={pageSize}
                                    onChange={e => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1); // Reset to page 1
                                    }}
                                >
                                    <option value={10}>10条/页</option>
                                    <option value={20}>20条/页</option>
                                    <option value={50}>50条/页</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 bg-slate-800 border-slate-700 hover:bg-slate-700" 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm font-medium text-slate-300 min-w-[2rem] text-center">
                                    {currentPage} / {Math.max(1, totalPages)}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 bg-slate-800 border-slate-700 hover:bg-slate-700" 
                                    disabled={currentPage >= totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
