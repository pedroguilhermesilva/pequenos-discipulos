import React, { Suspense } from 'react';
import { StoryPageContent } from '@/components/stories/StoryPageContent';

function StoryPageLoading() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-vida/20 border-t-vida animate-spin" />
    </div>
  );
}

export default function StoryPage() {
  return (
    <Suspense fallback={<StoryPageLoading />}>
      <StoryPageContent />
    </Suspense>
  );
}
