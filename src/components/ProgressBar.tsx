import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, label }) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="flex flex-col gap-2 mb-8">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#61896b] dark:text-primary">
          Passo {currentStep} de {totalSteps}
        </span>
        <span className="text-xs font-medium text-[#111813] dark:text-gray-400">{label}</span>
      </div>
      <div className="h-2 w-full bg-[#dbe6de] dark:bg-[#1e3a24] rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
