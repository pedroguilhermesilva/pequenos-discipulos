import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

const stepLabels = ['Quem é seu pequeno', 'Como contar', 'Quando ler'];

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, label }) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="flex flex-col gap-2 mb-8">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-oliva">
          {stepLabels[currentStep - 1] ?? `Passo ${currentStep}`}
        </span>
        <span className="text-xs font-medium text-oliva/70">{label}</span>
      </div>
      <div className="h-2 w-full bg-borda/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-vida transition-all duration-500 rounded-full"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        />
      </div>
    </div>
  );
};
