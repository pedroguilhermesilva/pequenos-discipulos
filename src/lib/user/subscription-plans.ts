import type { SubscriptionTier } from './usage-limits';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  limits: {
    text: string;
    audio: string;
    video: string;
  };
  profiles: string;
  badge?: string;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    tagline: 'Para começar a explorar histórias bíblicas.',
    features: [
      '1 perfil de criança',
      'Histórias adaptadas por idade',
      'Biblioteca e favoritos',
    ],
    limits: {
      text: '10 por mês',
      audio: '3 por mês',
      video: '1 por mês',
    },
    profiles: '1 filho',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 29,90',
    period: '/mês',
    tagline: 'Mais histórias para a rotina da família.',
    features: [
      'Até 3 perfis de criança',
      'Limites maiores de geração',
      'Prioridade em novos formatos',
    ],
    limits: {
      text: '50 por mês',
      audio: '20 por mês',
      video: '10 por mês',
    },
    profiles: 'Até 3 filhos',
    badge: 'Mais popular',
  },
  {
    id: 'family',
    name: 'Família',
    price: 'R$ 49,90',
    period: '/mês',
    tagline: 'Para famílias com vários pequenos discípulos.',
    features: [
      'Perfis ilimitados',
      'Geração ilimitada',
      'Ideal para irmãos com idades diferentes',
    ],
    limits: {
      text: 'Ilimitado',
      audio: 'Ilimitado',
      video: 'Ilimitado',
    },
    profiles: 'Filhos ilimitados',
  },
];

export function getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
  return subscriptionPlans.find((plan) => plan.id === tier) ?? subscriptionPlans[0];
}
