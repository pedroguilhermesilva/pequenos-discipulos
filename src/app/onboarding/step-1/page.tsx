import React, { Suspense } from 'react';
import { ensureOnboardingAccess } from '@/lib/onboarding/guard';
import { OnboardingStep1Content } from './OnboardingStep1Content';

function OnboardingStep1Loading() {
  return (
    <div className="min-h-screen bg-pergaminho textura-pergaminho flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-vida/20 border-t-vida animate-spin" />
    </div>
  );
}

export default async function OnboardingStep1Page({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string | string[] }>;
}) {
  await ensureOnboardingAccess(await searchParams);

  return (
    <Suspense fallback={<OnboardingStep1Loading />}>
      <OnboardingStep1Content />
    </Suspense>
  );
}
