import React, { Suspense } from 'react';
import { ensureOnboardingAccess } from '@/lib/onboarding/guard';
import { OnboardingStep3Content } from './OnboardingStep3Content';

function OnboardingStep3Loading() {
  return (
    <div className="min-h-screen bg-pergaminho textura-pergaminho flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-vida/20 border-t-vida animate-spin" />
    </div>
  );
}

export default async function OnboardingStep3Page({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string | string[] }>;
}) {
  await ensureOnboardingAccess(await searchParams);

  return (
    <Suspense fallback={<OnboardingStep3Loading />}>
      <OnboardingStep3Content />
    </Suspense>
  );
}
