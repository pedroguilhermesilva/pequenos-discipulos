import React from 'react';
import { StoryPageContent } from '@/components/stories/StoryPageContent';

type StoryPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StoryPage({ params, searchParams }: StoryPageProps) {
  const { id } = await params;
  const query = await searchParams;

  return <StoryPageContent storyId={id} serverSearchParams={query} />;
}
