import React, { Suspense } from 'react';
import { OnboardingStep3Content } from './OnboardingStep3Content';

function OnboardingStep3Loading() {
  return (
    <div className="min-h-screen bg-pergaminho textura-pergaminho flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-vida/20 border-t-vida animate-spin" />
    </div>
  );
}

export default function OnboardingStep3Page() {
  return (
    <Suspense fallback={<OnboardingStep3Loading />}>
      <OnboardingStep3Content />
    </Suspense>
  );
}
