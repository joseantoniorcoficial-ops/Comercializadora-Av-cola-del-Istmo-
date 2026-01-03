import React from 'react';

// Card Container
export const NeuCard: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = '', id }) => (
  <div id={id} className={`bg-surface rounded-2xl shadow-neu-flat p-6 ${className}`}>
    {children}
  </div>
);

// Button
interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success' | 'default';
}

export const NeuButton: React.FC<NeuButtonProps> = ({ children, className = '', variant = 'default', ...props }) => {
  let colorClass = 'text-primary';
  if (variant === 'primary') colorClass = 'text-primary font-bold';
  if (variant === 'danger') colorClass = 'text-error';
  if (variant === 'success') colorClass = 'text-success';

  return (
    <button
      className={`
        bg-background px-4 py-2 rounded-xl 
        shadow-neu-flat active:shadow-neu-pressed 
        transition-all duration-200 ease-in-out transform active:scale-95
        flex items-center justify-center gap-2
        ${colorClass} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

// Input
interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const NeuInput: React.FC<NeuInputProps> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">{label}</label>}
    <input
      className={`
        bg-background rounded-lg px-3 py-2 outline-none
        shadow-neu-pressed text-text-main placeholder-gray-400
        focus:ring-1 focus:ring-primary/30 transition-all
        ${className}
      `}
      {...props}
    />
  </div>
);
