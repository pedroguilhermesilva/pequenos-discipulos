import { AppShell } from '@/components/AppShell';
import { CommunityVersionReader } from '@/components/community/CommunityVersionReader';

type PageProps = {
  params: Promise<{ adaptationId: string }>;
};

export default async function CommunityVersionPage({ params }: PageProps) {
  const { adaptationId } = await params;

  return (
    <AppShell>
      <CommunityVersionReader adaptationId={adaptationId} />
    </AppShell>
  );
}
