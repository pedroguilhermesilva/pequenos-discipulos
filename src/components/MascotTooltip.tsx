import React from 'react';
import { cn } from '@/lib/cn';

const MASCOT_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBn3CQNYFbFi52iHGP5_VGyDnpNnynZz9eblzRI690X_88sSRld4RRBstkcoBSHgkllGwb8eUlAeo8qySuo7LFR47B3lQmygn9rsCD4FBt2os_Mv61PVuwv0uLxBTANuB36uRC2d22NyiLz4HP-5iSCTg_wNPjMPmunKhlNpfUtuuGPs7K_D1n6Hr_JydOSbRKFLJL-YS27ycxRdFB-ytia3d4Xp5BFszf5JerJA0X_7DXf1UN88_8hpSTCyMa-klhoicbTuW8QeOfN';

interface MascotTooltipProps {
  message: string;
  title?: string;
  tip: string;
  celebrate?: boolean;
  className?: string;
}

export const MascotTooltip: React.FC<MascotTooltipProps> = ({
  message,
  title = 'Boaz, o Cordeirinho',
  tip,
  celebrate = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full md:w-[320px] bg-pergaminho-escuro p-8 flex flex-col items-center justify-center text-center border-l border-borda textura-pergaminho',
        className
      )}
    >
      <div className="mb-6 relative animate-fade-in">
        <div className="bg-white p-4 rounded-livro shadow-livro border border-borda mb-6 relative">
          <p className="text-tinta text-sm font-medium leading-relaxed">{message}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-borda rotate-45" />
        </div>
        <div className="relative">
          <div
            className="w-44 h-44 bg-center bg-no-repeat bg-contain mx-auto"
            role="img"
            aria-label="Boaz, o cordeirinho mascote do Pequenos Discípulos"
            style={{ backgroundImage: `url("${MASCOT_SRC}")` }}
          />
          {celebrate && (
            <div className="absolute -top-4 right-4 transform rotate-12">
              <span
                className="material-symbols-outlined text-dourado text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                celebration
              </span>
            </div>
          )}
        </div>
      </div>
      <h3 className="text-tinta font-display font-bold text-lg mb-2">{title}</h3>
      <p className="text-oliva text-sm leading-relaxed">{tip}</p>
    </div>
  );
};
