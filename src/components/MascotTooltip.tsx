import React from 'react';

interface MascotTooltipProps {
  message: string;
  title: string;
  tip: string;
}

export const MascotTooltip: React.FC<MascotTooltipProps> = ({ message, title, tip }) => {
  return (
    <div className="w-full md:w-[320px] bg-[#f0f9f2] dark:bg-[#152a1a] p-8 flex flex-col items-center justify-center text-center border-l border-[#dbe6de] dark:border-[#1e3a24]">
      <div className="mb-6 relative">
        <div className="bg-white dark:bg-background-dark p-4 rounded-xl shadow-sm border border-[#dbe6de] dark:border-[#1e3a24] mb-6 relative">
          <p className="text-[#111813] dark:text-white text-sm font-medium">
            {message}
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-background-dark border-b border-r border-[#dbe6de] dark:border-[#1e3a24] rotate-45"></div>
        </div>
        <div
          className="w-48 h-48 bg-center bg-no-repeat bg-contain mx-auto"
          aria-label="Ilustração amigável de um cordeirinho sorridente mascote do app"
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBn3CQNYFbFi52iHGP5_VGyDnpNnynZz9eblzRI690X_88sSRld4RRBstkcoBSHgkllGwb8eUlAeo8qySuo7LFR47B3lQmygn9rsCD4FBt2os_Mv61PVuwv0uLxBTANuB36uRC2d22NyiLz4HP-5iSCTg_wNPjMPmunKhlNpfUtuuGPs7K_D1n6Hr_JydOSbRKFLJL-YS27ycxRdFB-ytia3d4Xp5BFszf5JerJA0X_7DXf1UN88_8hpSTCyMa-klhoicbTuW8QeOfN")' }}
        >
        </div>
      </div>
      <h3 className="text-[#111813] dark:text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-[#61896b] dark:text-gray-400 text-sm">
        {tip}
      </p>
    </div>
  );
};
