'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name,
        }
      },
    });
    if (error) setMessage(error.message);
    else setMessage('Verifique seu e-mail para confirmar o cadastro.');
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setMessage(error.message);
    else router.push('/onboarding/step-1');
    setLoading(false);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-0 m-0 overflow-x-hidden font-display">
      <div className="flex w-full min-h-screen">
        {/* Left Side: Illustration (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#102215] overflow-hidden items-center justify-center p-12">
          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
            <div className="w-full aspect-square rounded-xl overflow-hidden mb-8 shadow-2xl border-4 border-white/10">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDcp7f3CSC24jWLmlZQRMfSqkBN5rheA5OA48L560LMbQfQhwlNuE96wI7f5oDKggU7iqa3djpjb67xrYNsujlOCFlDUx9xURff8kBZtMg6Hipj-UmPU1Gmx6BZbnVEeHJseTjf5OPuv_4Zc8Ng_TCBPcJ44B13PbBtdx_A_poMbITt_1v66JFdKJKyt7tAWS2_zlyQ6HKGFJmT-uYzCssiVprT7RSu2XCEa929d7inzKLUO2ME1ZBKs_bzzT_VHHdnMvkfTGelxF39")' }}
              ></div>
            </div>
            <h1 className="text-white text-4xl font-extrabold tracking-tight mb-4">Transforme a Bíblia em Histórias Mágicas</h1>
            <p className="text-gray-300 text-lg">Use IA para adaptar passagens bíblicas para os pequenos, criando momentos inesquecíveis de aprendizado e fé.</p>
            <div className="mt-8 flex gap-2">
              <span className={`w-2 h-2 rounded-full ${mode === 'login' ? 'bg-primary' : 'bg-white/20'}`}></span>
              <span className={`w-2 h-2 rounded-full ${mode === 'signup' ? 'bg-primary' : 'bg-white/20'}`}></span>
              <span className="w-2 h-2 rounded-full bg-white/20"></span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Panel */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white dark:bg-background-dark px-6 py-12">
          <div className="w-full max-w-[440px] flex flex-col">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="bg-primary/10 p-3 rounded-xl mb-3">
                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pequenos Discípulos</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta para começar'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 mb-8">
              <button
                onClick={() => { setMode('login'); setMessage(''); }}
                className={`flex-1 flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 transition-all ${
                  mode === 'login' ? 'border-primary text-gray-900 dark:text-white' : 'border-transparent text-gray-400 dark:text-gray-500'
                }`}
              >
                <span className="text-sm font-bold tracking-wide">Entrar</span>
              </button>
              <button
                onClick={() => { setMode('signup'); setMessage(''); }}
                className={`flex-1 flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 transition-all ${
                  mode === 'signup' ? 'border-primary text-gray-900 dark:text-white' : 'border-transparent text-gray-400 dark:text-gray-500'
                }`}
              >
                <span className="text-sm font-bold tracking-wide">Criar Conta</span>
              </button>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button className="flex items-center justify-center gap-2 rounded-xl h-12 px-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-bold transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
                <img alt="Google logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzhMBmxHNgzO72P89frbXQC8JDwias9nL8WoPPjr-fFFWA-LudhjvYDfOIKBzeZ__TS4S08M7S1G1-PALJWuhaQy2O5Z2s8SyNgwK0ehwsGxxmSwC2i8OBOnU5PVvybAw7oIoNvQ4nfVK5YkZkMAgcmmPtMYC0efzl0hgcd6iHmiPf0gVEajbOgyAd2nRVaTddFrz_rIJAjHp9t6yIAMVSLzKIsQEMY1E-YRUFrXgY9rndnHdOKUOIz6KEQIvvEOPwWhLLlBE1zJiS" />
                <span>Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 rounded-xl h-12 px-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-bold transition-all hover:bg-gray-50 dark:hover:bg-gray-700">
                <img alt="Apple logo" className="w-5 h-5 dark:invert" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFJvbmgK0ML_kqhoZ-OIJ6UT9A2uZWB0wemztJjMQINjIZxMCi-ZNRiMMnUSAggDIvsTpqNmb_Jd9z5t4C2RtEs50P_gxJZRmygSixiqEbimqBfk8v7aZfpqzOhneMt4t7ywvMtWADaL4FKhrPaoUeIud8eIJqdcbYlEHOon7FWdeKcWSf-YiU1ya0ZCZHr3xgbBdA0YH8SQ5gnIGaxXF6yGuSkXZTsWgC_PRsetjLNpPa_HL_8EyWLB9thdZT--WVLEhuL_9NAqGU" />
                <span>Apple</span>
              </button>
            </div>

            <div className="relative flex py-3 items-center mb-6">
              <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                {mode === 'login' ? 'ou use e-mail' : 'ou preencha os dados'}
              </span>
              <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
            </div>

            {/* Forms */}
            {mode === 'login' ? (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">E-mail</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                    id="email"
                    placeholder="seu@email.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300" htmlFor="password">Senha</label>
                    <a className="text-xs font-bold text-primary hover:text-primary/80 transition-colors" href="#">Esqueci minha senha</a>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" id="remember" type="checkbox" />
                  <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="remember">Manter conectado</label>
                </div>
                <button
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-gray-900 font-bold text-base rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  type="submit"
                >
                  <span>{loading ? 'Entrando...' : 'Entrar'}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="name">Nome Completo</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                    id="name"
                    placeholder="Seu nome"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="email">E-mail</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                    id="email"
                    placeholder="seu@email.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="password">Senha</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="confirm-password">Confirmar Senha</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                      id="confirm-password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    disabled={loading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-gray-900 font-bold text-base rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    type="submit"
                  >
                    <span>{loading ? 'Criando...' : 'Criar minha conta'}</span>
                    <span className="material-symbols-outlined">person_add</span>
                  </button>
                </div>
              </form>
            )}

            {/* Dev Mode Bypass */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100 dark:border-gray-800"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-background-dark px-2 text-gray-400">Desenvolvimento</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/onboarding/step-1')}
              className="w-full py-3 border-2 border-dashed border-[#61896b] text-[#61896b] font-bold rounded-xl hover:bg-[#61896b]/5 transition-all"
            >
              Acessar em Modo de Desenvolvimento
            </button>

            {/* Status Message */}
            {message && (
              <p className={`mt-4 text-center text-sm font-medium ${message.includes('Verifique') ? 'text-primary' : 'text-red-500'}`}>
                {message}
              </p>
            )}

            {/* Footer */}
            <p className="mt-10 text-center text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
              Ao continuar, você concorda com nossos <br />
              <a className="underline hover:text-gray-700 dark:hover:text-gray-300" href="#">Termos de Uso</a> e
              <a className="underline hover:text-gray-700 dark:hover:text-gray-300" href="#">Política de Privacidade</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
