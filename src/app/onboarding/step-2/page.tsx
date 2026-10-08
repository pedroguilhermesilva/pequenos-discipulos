import React, { Suspense } from 'react';
import { ensureOnboardingAccess } from '@/lib/onboarding/guard';
import { OnboardingStep2Content } from './OnboardingStep2Content';

function OnboardingStep2Loading() {
  return (
    <div className="min-h-screen bg-pergaminho textura-pergaminho flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-vida/20 border-t-vida animate-spin" />
    </div>
  );
}

export default async function OnboardingStep2Page({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string | string[] }>;
}) {
  await ensureOnboardingAccess(await searchParams);

  return (
    <Suspense fallback={<OnboardingStep2Loading />}>
      <OnboardingStep2Content />
    </Suspense>
  );
}
