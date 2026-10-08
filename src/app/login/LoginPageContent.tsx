'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { Logo } from '@/components/ui/Logo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { LegalFooterLinks } from '@/components/legal/LegalFooterLinks';
import { CURRENT_CONSENT_VERSION } from '@/lib/privacy/constants';
import { sanitizeCallbackPath } from '@/lib/auth/safe-redirect-client';

const INVALID_CREDENTIALS_MESSAGE = 'Credenciais inválidas.';

export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackPath(searchParams.get('callbackUrl'));

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  const hasGoogle = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = (await response.json()) as { ok: boolean; message?: string };

      setLoading(false);

      if (!json.ok) {
        setMessage(json.message ?? INVALID_CREDENTIALS_MESSAGE);
        return;
      }

      await getSession();
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setLoading(false);
      setMessage('Erro de rede. Tente novamente.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!consentAccepted) {
      setMessage('Aceite a Política de Privacidade e os Termos de Uso para criar a conta.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          consentAccepted: true,
          consentVersion: CURRENT_CONSENT_VERSION,
        }),
      });
      const json = (await response.json()) as { ok: boolean; message?: string };

      if (!json.ok) {
        setMessage(json.message ?? 'Não foi possível criar a conta.');
        setLoading(false);
        return;
      }

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginJson = (await loginResponse.json()) as { ok: boolean; message?: string };

      setLoading(false);

      if (!loginJson.ok) {
        setMessage(loginJson.message ?? INVALID_CREDENTIALS_MESSAGE);
        return;
      }

      await getSession();
      router.push('/onboarding/step-1');
      router.refresh();
    } catch {
      setLoading(false);
      setMessage('Erro de rede. Tente novamente.');
    }
  };

  const handleGoogle = () => {
    void signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-pergaminho textura-pergaminho flex">
      <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-20 bg-vida/5 border-r border-borda animate-fade-in relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-dourado/10 blur-3xl" />
        <p className="text-oliva text-sm font-semibold uppercase tracking-[0.2em] mb-6">
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
            <h2 className="font-display text-2xl font-bold text-tinta mb-1">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </h2>
            <p className="text-oliva">
              {mode === 'login'
                ? 'Acesso dos pais — cada criança tem o seu perfil dentro da conta.'
                : 'Comece gratuitamente e configure o perfil do seu pequeno.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            {mode === 'signup' && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-tinta mb-1.5">
                  Seu nome
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-12 rounded-livro border-borda bg-white text-tinta px-4 focus:border-vida focus:ring-vida"
                  autoComplete="name"
                />
              </div>
            )}

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
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'signup' && (
              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-borda text-vida focus:ring-vida"
                />
                <span className="text-sm text-oliva leading-relaxed">
                  Li e aceito a{' '}
                  <Link href="/privacidade" target="_blank" className="text-vida font-semibold hover:underline">
                    Política de Privacidade
                  </Link>{' '}
                  e os{' '}
                  <Link href="/termos" target="_blank" className="text-vida font-semibold hover:underline">
                    Termos de Uso
                  </Link>
                  .
                </span>
              </label>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <PrimaryButton type="submit" disabled={loading} fullWidth>
                {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
              </PrimaryButton>

              <SecondaryButton
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setMessage('');
                }}
                disabled={loading}
                fullWidth
              >
                {mode === 'login' ? 'Criar conta' : 'Já tenho conta'}
              </SecondaryButton>

              {hasGoogle && (
                <>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-borda" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-pergaminho px-2 text-oliva">ou</span>
                    </div>
                  </div>

                  <GoogleSignInButton
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    fullWidth
                    aria-label="Continuar com Google"
                  />
                </>
              )}
            </div>
          </form>

          {process.env.NODE_ENV === 'development' && mode === 'login' && (
            <p className="mt-4 text-xs text-oliva/70 text-center">
              Dev: use o utilizador seed{' '}
              <span className="font-mono">dev@pequenos-discipulos.local</span> /{' '}
              <span className="font-mono">devpassword123</span>
            </p>
          )}

          {message && (
            <p role="alert" className="mt-4 text-center text-sm font-medium text-red-600">
              {message}
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-borda">
            <LegalFooterLinks className="text-xs" />
          </div>
        </div>
      </div>
    </div>
  );
}
