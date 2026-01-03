import React from 'react';

// Modern Card (Updated to Soft UI)
export const ModernCard: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = '', id }) => (
  <div id={id} className={`soft-card p-6 ${className}`}>
    {children}
  </div>
);

// Modern Button
interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const ModernButton: React.FC<ModernButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
  // Base styling handled by CSS classes in index.html, we just append custom className
  const baseClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
  
  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Modern Input
interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  fullWidth?: boolean;
}

export const ModernInput: React.FC<ModernInputProps> = ({ label, className = '', fullWidth = true, ...props }) => {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}>
        {label && <label>{label}</label>}
        <input className={className} {...props} />
    </div>
  );
};

// Modern Select
interface ModernSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const ModernSelect: React.FC<ModernSelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label>{label}</label>}
    <div className="relative">
      <select className={className} {...props}>
        <option value="" disabled>Seleccionar...</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  </div>
);