'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { hasProfiles } from '@/lib/profiles/storage';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const continueAsDev = () => {
    router.push(hasProfiles() ? '/perfis' : '/onboarding/step-1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Dev auth: any non-empty credentials continue into the app.
    if (!email.trim() || !password.trim()) {
      setMessage('Informe e-mail e senha para continuar.');
      setLoading(false);
      return;
    }

    continueAsDev();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-pergaminho textura-pergaminho flex">
      <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-20 bg-vida/5 border-r border-borda animate-fade-in">
        <p className="text-oliva text-sm font-semibold uppercase tracking-widest mb-6">
          Uma história por noite
        </p>
        <h1 className="font-display text-4xl xl:text-5xl font-bold text-tinta leading-tight mb-6 max-w-md">
          Continue a jornada de fé do seu pequeno
        </h1>
        <p className="text-oliva text-lg leading-relaxed max-w-sm mb-10">
          Histórias bíblicas adaptadas à idade, ao tom e ao momento de leitura da sua família.
        </p>
        <blockquote className="font-story text-xl text-tinta/80 border-l-4 border-dourado pl-4 max-w-sm italic">
          &ldquo;Instrui a criança no caminho em que deve andar.&rdquo;
          <footer className="text-oliva text-sm not-italic mt-2">— Provérbios 22:6</footer>
        </blockquote>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="max-w-md w-full animate-slide-in-right">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-block mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
            >
              <Logo size="lg" />
            </Link>
            <h2 className="font-display text-2xl font-bold text-tinta mb-1">Entrar</h2>
            <p className="text-oliva">Modo local — autenticação real chega depois</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-tinta mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-livro border-borda bg-white text-tinta px-4 focus:border-vida focus:ring-vida"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-tinta mb-1.5">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 rounded-livro border-borda bg-white text-tinta px-4 focus:border-vida focus:ring-vida"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <PrimaryButton type="submit" disabled={loading} fullWidth>
                {loading ? 'Entrando...' : 'Entrar'}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={continueAsDev} disabled={loading} fullWidth>
                Criar conta (dev)
              </SecondaryButton>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-borda" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-pergaminho px-2 text-oliva">ou</span>
                </div>
              </div>

              <button
                type="button"
                onClick={continueAsDev}
                className="w-full py-2.5 text-xs text-oliva/60 hover:text-oliva transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded"
              >
                Acessar em modo de desenvolvimento
              </button>
            </div>
          </form>

          {message && (
            <p role="alert" className="mt-4 text-center text-sm font-medium text-red-600">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
