import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { userNeedsConsent } from '@/lib/privacy/require-consent';
import { ConsentPageContent } from '@/app/consentimento/ConsentPageContent';

export const metadata = {
  title: 'Aceitar termos — Pequenos Discípulos',
  description: 'Confirme que leu e aceita a Política de Privacidade e os Termos de Uso.',
};

export default async function ConsentimentoPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { consentAcceptedAt: true, consentVersion: true },
  });

  if (user && !userNeedsConsent(user)) {
    redirect('/home');
  }

  return <ConsentPageContent />;
}
