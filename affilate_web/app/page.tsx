'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Gọi hàm lấy sản phẩm mỗi khi từ khóa tìm kiếm hoặc bộ lọc danh mục thay đổi
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase.from('products').select('*');

        // Bộ lọc tìm kiếm theo tên (không phân biệt chữ hoa, chữ thường)
        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        // Bộ lọc theo danh mục Thời trang / Mỹ phẩm
        if (categoryFilter !== 'all') {
          query = query.eq('category', categoryFilter);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setProducts(data as Product[]);
        }
      } catch (error: any) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', error?.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, categoryFilter]);

  // Hàm xử lý đếm số lượt click trước khi chuyển hướng sang Shopee/TikTok
  const handleProductClick = async (productId: string, affiliateLink: string) => {
    try {
      // Âm thầm ghi log vào bảng click_logs
      await supabase.from('click_logs').insert([{ product_id: productId }]);
    } catch (error) {
      console.error('Không thể ghi nhận lượt click:', error);
    } finally {
      // Dù có lỗi ghi log hay không thì vẫn phải mở link cho khách mua hàng
      window.open(affiliateLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-6xl mx-auto p-4 md:p-8">

        {/* Header trên cùng / Nút Đăng nhập */}
        <div className="flex justify-end mb-2">
          <a href="/login" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:text-pink-600 hover:border-pink-200 shadow-sm transition flex items-center">
            🔐 Đăng nhập Admin
          </a>
        </div>

        {/* Tiêu đề trang chủ */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600 mb-2">
            Xu Hướng Thời Trang & Mỹ Phẩm
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Tổng hợp những sản phẩm hot nhất trên TikTok Shop & Shopee
          </p>
        </header>

        {/* Thanh Tìm kiếm & Bộ lọc (Bộ điều hướng) */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm váy áo, son môi, kem chống nắng..."
              className="w-full border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 p-3 pl-4 rounded-xl text-sm outline-none transition"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 p-3 rounded-xl text-sm outline-none bg-white font-medium cursor-pointer transition min-w-[160px]"
            value={categoryFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
          >
            <option value="all">✨ Tất cả danh mục</option>
            <option value="thoi-trang">👗 Thời Trang</option>
            <option value="my-pham">💄 Mỹ Phẩm</option>
          </select>
        </div>

        {/* Khu vực hiển thị danh sách sản phẩm */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-lg">Chưa có sản phẩm nào phù hợp với tìm kiếm của bạn.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-100 rounded-2xl p-3 md:p-4 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Khung chứa ảnh */}
                  <div className="w-full h-44 md:h-52 overflow-hidden rounded-xl mb-3 bg-gray-100 relative">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 text-[10px] uppercase font-bold bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded-full shadow-sm">
                      {product.category === 'thoi-trang' ? 'Thời trang' : 'Mỹ phẩm'}
                    </span>
                  </div>

                  {/* Tên sản phẩm */}
                  <h2 className="font-semibold text-gray-800 text-xs md:text-sm line-clamp-2 min-h-[36px] md:min-h-[40px] group-hover:text-pink-600 transition">
                    {product.name}
                  </h2>

                  {/* Giá tiền */}
                  <p className="text-rose-500 font-extrabold text-sm md:text-base mt-2">
                    {product.price > 0 ? `${Number(product.price).toLocaleString()}đ` : 'Giá ưu đãi'}
                  </p>
                </div>

                {/* Nút bấm Affiliate */}
                <button
                  onClick={() => handleProductClick(product.id, product.affiliate_link)}
                  className="mt-4 block w-full text-center bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl text-xs md:text-sm font-semibold hover:from-pink-600 hover:to-rose-600 active:scale-95 transition shadow-sm shadow-pink-100"
                >
                  Mua ngay
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Footer with Admin Login Link */}
      <footer className="mt-16 text-center text-sm text-gray-400 pb-8">
        <p>© {new Date().getFullYear()} Xu Hướng Shopping. All rights reserved.</p>
        <a href="/login" className="hover:text-pink-500 transition mt-2 inline-block">Admin Login</a>
      </footer>
    </div>
  );
}