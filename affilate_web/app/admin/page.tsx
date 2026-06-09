'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Statistics, TopProductStat, ClickLog } from '@/types';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface FormState {
    id: string;
    name: string;
    category: 'thoi-trang' | 'my-pham';
    price: string;
    image_url: string;
    affiliate_link: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [form, setForm] = useState<FormState>({ id: '', name: '', category: 'thoi-trang', price: '', image_url: '', affiliate_link: '' });
    const [stats, setStats] = useState<Statistics>({ today: 0, week: 0, month: 0 });
    const [allProductStats, setAllProductStats] = useState<TopProductStat[]>([]);

    useEffect(() => {
        fetchProducts();
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0)).toISOString();

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        const startOfWeekStr = startOfWeek.toISOString();

        const startOfMonth = new Date();
        startOfMonth.setDate(startOfMonth.getDate() - 30);
        const startOfMonthStr = startOfMonth.toISOString();

        const { count: todayCount } = await supabase.from('click_logs').select('*', { count: 'exact', head: true }).gte('clicked_at', startOfToday);
        const { count: weekCount } = await supabase.from('click_logs').select('*', { count: 'exact', head: true }).gte('clicked_at', startOfWeekStr);
        const { count: monthCount } = await supabase.from('click_logs').select('*', { count: 'exact', head: true }).gte('clicked_at', startOfMonthStr);

        setStats({ today: todayCount || 0, week: weekCount || 0, month: monthCount || 0 });

        // Lấy thống kê click sản phẩm
        const { data: logsData } = await supabase.from('click_logs').select('product_id, products(name)');
        const logs = logsData as unknown as ClickLog[];

        if (logs) {
            const counts = logs.reduce((acc: Record<string, { name: string; count: number }>, log) => {
                const pId = log.product_id;
                const pName = log.products?.name || 'Sản phẩm đã bị xóa';
                if (!acc[pId]) acc[pId] = { name: pName, count: 0 };
                acc[pId].count += 1;
                return acc;
            }, {});

            const sortedProducts = Object.values(counts).sort((a, b) => b.count - a.count);
            setAllProductStats(sortedProducts);
        }
    };

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) setProducts(data as Product[]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: form.name,
            category: form.category,
            price: parseFloat(form.price) || 0,
            image_url: form.image_url,
            affiliate_link: form.affiliate_link
        };

        if (form.id) {
            await supabase.from('products').update(payload).eq('id', form.id);
        } else {
            await supabase.from('products').insert([payload]);
        }
        setForm({ id: '', name: '', category: 'thoi-trang', price: '', image_url: '', affiliate_link: '' });
        fetchProducts();
        fetchStatistics();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
            await supabase.from('products').delete().eq('id', id);
            fetchProducts();
            fetchStatistics();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        Cookies.remove('sb-access-token');
        router.push('/login');
    };

    return (
        <div className="max-w-7xl mx-auto p-4 flex flex-col gap-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-2">
                <div>
                    <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 font-medium">Trang quản trị các sản phẩm Affiliate</p>
                </div>
                <button onClick={handleLogout} className="mt-4 sm:mt-0 font-medium bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition">
                    Đăng xuất
                </button>
            </div>

            {/* Thống kê Tổng quan Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center shadow-sm">
                    <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">Hôm nay</p>
                    <p className="text-4xl font-extrabold text-blue-900 mt-2">{stats.today} <span className="text-lg font-semibold text-blue-400">lượt click</span></p>
                </div>
                <div className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center shadow-sm">
                    <p className="text-sm text-green-600 font-bold uppercase tracking-wider">7 ngày qua</p>
                    <p className="text-4xl font-extrabold text-green-900 mt-2">{stats.week} <span className="text-lg font-semibold text-green-400">lượt click</span></p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl text-center shadow-sm">
                    <p className="text-sm text-purple-600 font-bold uppercase tracking-wider">30 ngày qua</p>
                    <p className="text-4xl font-extrabold text-purple-900 mt-2">{stats.month} <span className="text-lg font-semibold text-purple-400">lượt click</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
                {/* Khu vực CRUD - Cột trái */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <form onSubmit={handleSubmit} className="border border-gray-100 p-5 rounded-2xl bg-white flex flex-col gap-4 shadow-sm w-full">
                        <h2 className="text-lg font-bold text-gray-800">{form.id ? '📝 Sửa Sản Phẩm' : '➕ Thêm Sản Phẩm Mới'}</h2>
                        <input type="text" placeholder="Tên sản phẩm" className="border border-gray-200 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 p-3 rounded-xl bg-gray-50 text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        <select className="border border-gray-200 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 p-3 rounded-xl bg-gray-50 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as 'thoi-trang' | 'my-pham' })}>
                            <option value="thoi-trang">Thời Trang 👗</option>
                            <option value="my-pham">Mỹ Phẩm 💄</option>
                        </select>
                        <input type="number" placeholder="Giá" className="border border-gray-200 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 p-3 rounded-xl bg-gray-50 text-sm" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                        <input type="text" placeholder="URL Hình ảnh" className="border border-gray-200 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 p-3 rounded-xl bg-gray-50 text-sm" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} required />
                        <input type="text" placeholder="Link Affiliate" className="border border-gray-200 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 p-3 rounded-xl bg-gray-50 text-sm" value={form.affiliate_link} onChange={e => setForm({ ...form, affiliate_link: e.target.value })} required />
                        
                        <div className="flex gap-2 mt-2">
                            <button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition shadow-sm active:scale-95">{form.id ? 'Lưu thay đổi' : 'Thêm mới'}</button>
                            {form.id && (
                                <button type="button" onClick={() => setForm({ id: '', name: '', category: 'thoi-trang', price: '', image_url: '', affiliate_link: '' })} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">Hủy sửa</button>
                            )}
                        </div>
                    </form>

                    {/* Bảng thống kê chi tiết lượt Click */}
                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 text-lg">📊 Bảng thống kê Click chi tiết</h3>
                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white sticky top-0 border-b border-gray-100 z-10">
                                    <tr>
                                        <th className="py-3 px-2 font-bold text-gray-500 uppercase text-xs tracking-wider">Sản phẩm</th>
                                        <th className="py-3 px-2 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Clicks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {allProductStats.map((p, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition">
                                            <td className="py-3 px-2 text-gray-700 font-medium truncate max-w-[150px]">{p.name}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className="bg-pink-50 text-pink-600 font-bold px-2.5 py-1 rounded-lg text-xs">{p.count}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {allProductStats.length === 0 && (
                                        <tr><td colSpan={2} className="p-4 text-center text-gray-400">Chưa có dữ liệu</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Bảng Sản phẩm - Cột phải với Grid layout */}
                <div className="lg:col-span-2 border border-gray-100 p-5 rounded-2xl shadow-sm bg-white">
                    <h2 className="text-lg font-bold text-gray-800 mb-5">📦 Danh sách sản phẩm hiện tại ({products.length})</h2>
                    
                    {/* Grid tối đa 4 cột, tối đa 3 dòng (mỗi dòng cỡ ~240px cộng khoảng cách, max-h-[750px] tương ứng khoảng 3 dòng thẻ), có cuộn */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[780px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                        {products.map(p => (
                            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col justify-between hover:shadow-md transition shadow-sm group">
                                <div>
                                    <div className="w-full h-32 md:h-36 overflow-hidden rounded-xl mb-3 relative bg-gray-50">
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                    </div>
                                    <h4 className="font-semibold text-xs md:text-sm line-clamp-2 text-gray-800 h-9">{p.name}</h4>
                                    <p className="text-[10px] uppercase font-bold text-pink-500 mt-2 tracking-wider">{p.category === 'thoi-trang' ? 'Thời Trang' : 'Mỹ Phẩm'}</p>
                                    <p className="text-sm font-extrabold text-rose-500 mt-1">{p.price > 0 ? `${p.price.toLocaleString()}đ` : 'Liên hệ'}</p>
                                </div>
                                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                                    <button onClick={() => setForm({ id: p.id, name: p.name, category: p.category, price: p.price.toString(), image_url: p.image_url, affiliate_link: p.affiliate_link })} className="flex-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg transition">Sửa</button>
                                    <button onClick={() => handleDelete(p.id)} className="flex-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg transition">Xóa</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {products.length === 0 && (
                        <div className="text-center text-gray-400 py-10">Bạn chưa có sản phẩm nào.</div>
                    )}
                </div>
            </div>
            {/* Custom scrollbar css inline if needed, typically you can define this in globals.css */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1; 
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ccc; 
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #aaa; 
                }
            `}</style>
        </div>
    );
}