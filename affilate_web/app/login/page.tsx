'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setError('Sai email hoặc mật khẩu!');
            setLoading(false);
            return;
        }

        if (data?.session) {
            Cookies.set('sb-access-token', data.session.access_token, { expires: 1 });
            router.push('/admin');
            router.refresh();
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gray-50 text-gray-800 p-4">
            <Link href="/" className="absolute left-4 top-4 inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-pink-300 hover:text-pink-600">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-pink-600">A</span>
                <span>Trang chủ</span>
            </Link>
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600 mb-2">
                        Admin Login
                    </h1>
                    <p className="text-gray-500 text-sm">Quản trị viên Affiliate</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm text-center border border-red-100">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 p-3 rounded-xl outline-none transition"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            className="w-full border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 p-3 rounded-xl outline-none transition"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 block w-full text-center bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 active:scale-95 transition shadow-sm shadow-pink-100 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}
