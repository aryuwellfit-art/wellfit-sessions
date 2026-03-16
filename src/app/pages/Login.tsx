import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Dumbbell, LogIn, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, loading } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const trainer = await login(email, password);
      if (trainer) {
        if (trainer.role === 'admin' || trainer.role === 'area_manager') {
          navigate('/admin');
        } else {
          navigate('/trainer');
        }
      } else {
        setErrorMsg('メールアドレスまたはパスワードが正しくありません');
      }
    } catch {
      setErrorMsg('ログインに失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  const fillAccount = (mail: string, pass: string) => {
    setEmail(mail);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f0f7e6 0%, #e8f5ea 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
          >
            <Dumbbell size={40} className="text-white" />
          </div>
          <h1 className="text-gray-800 mb-1">FitLab</h1>
          <p className="text-gray-500 text-sm">パーソナルジム 電子カルテシステム</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-gray-700 mb-6 text-center">ログイン</h2>

          {loading && (
            <div className="mb-4 text-center text-sm text-gray-400 animate-pulse">
              サーバーに接続中...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">メールアドレス</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] focus:ring-2 focus:ring-[#BBD168]/30 bg-gray-50 transition-all"
                  placeholder="email@fitlab.jp"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">パスワード</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#99CEA0] focus:ring-2 focus:ring-[#BBD168]/30 bg-gray-50 transition-all"
                  placeholder="パスワード"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full py-3 rounded-xl text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #BBD168, #99CEA0)' }}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  ログイン
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">デモアカウント（クリックで入力）</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillAccount('admin@fitlab.jp', 'admin1234')}
                className="text-sm py-2.5 px-3 rounded-xl border border-gray-200 hover:border-[#BBD168] hover:bg-[#BBD168]/5 text-gray-600 transition-colors"
              >
                🔑 管理者
              </button>
              <button
                type="button"
                onClick={() => fillAccount('area@fitlab.jp', 'area1234')}
                className="text-sm py-2.5 px-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 transition-colors"
              >
                📊 エリアMgr
              </button>
              <button
                type="button"
                onClick={() => fillAccount('tanaka@fitlab.jp', 'trainer1234')}
                className="text-sm py-2.5 px-3 rounded-xl border border-gray-200 hover:border-[#99CEA0] hover:bg-[#99CEA0]/5 text-gray-600 transition-colors"
              >
                💪 トレーナー
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2025 FitLab Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
