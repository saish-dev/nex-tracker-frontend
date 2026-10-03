
import React, { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '../utils';

// --- Types ---
interface CardProps {
  children: ReactNode;
  className?: string;
  [key: string]: any;
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral' | 'indigo';
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  [key: string]: any;
}

interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

interface SearchableSelectOption {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

// --- Card ---
export const Card = ({ children, className, ...props }: CardProps) => (
  <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-card transition-shadow duration-200', className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ title, description, action, className }: CardHeaderProps) => (
  <div className={cn("px-6 py-4.5 border-b border-slate-100 flex justify-between items-center", className)}>
    <div>
      <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    {action && <div className="ml-4 flex items-center gap-2">{action}</div>}
  </div>
);

export const CardContent = ({ children, className }: CardContentProps) => (
  <div className={cn('p-6', className)}>{children}</div>
);

// --- ProgressBar ---
interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  colorClass?: string;
  showLabel?: boolean;
}

export const ProgressBar = ({ value, max = 100, className, colorClass = 'bg-indigo-600', showLabel = false }: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-1 text-[11px] font-mono text-slate-500">
          <span>{percentage.toFixed(0)}%</span>
          <span>{value}/{max}</span>
        </div>
      )}
    </div>
  );
};

// --- Badge ---
export const Badge = ({ children, className, variant = 'default' }: BadgeProps) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    neutral: 'bg-slate-50 text-slate-600 border border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-tight', variants[variant], className)}>
      {children}
    </span>
  );
};

// --- Button ---
export const Button = ({ children, className, variant = 'primary', size = 'md', ...props }: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap';
  
  const variants = {
    primary: 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 active:from-indigo-800 active:to-indigo-700 shadow-md shadow-indigo-600/25 focus-visible:ring-indigo-500',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-sm focus-visible:ring-slate-400',
    outline: 'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-slate-400',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200/70',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-200/50 focus-visible:ring-rose-500'
  };

  const sizes = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3.5 py-2 text-sm gap-2',
    lg: 'h-11 px-5 text-base gap-2.5'
  };

  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};

// --- Form Elements ---
export const Label = ({ children, htmlFor, className }: LabelProps) => (
  <label htmlFor={htmlFor} className={cn("block text-sm font-semibold text-slate-700 mb-1.5", className)}>
    {children}
  </label>
);

export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'block w-full rounded-xl border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm py-2.5 px-3.5 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500 border',
        className
      )}
      {...props}
    />
));
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'block w-full rounded-xl border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm py-2.5 px-3.5 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500 border',
        className
      )}
      {...props}
    />
));
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'block w-full rounded-xl border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm py-2.5 px-3.5 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500 border',
        className
      )}
      {...props}
    />
));
Textarea.displayName = 'Textarea';

export const Checkbox = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition duration-150 ease-in-out cursor-pointer',
          className
        )}
        {...props}
      />
));
Checkbox.displayName = 'Checkbox';

// --- Searchable Select ---
export const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  className 
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div 
        className={cn(
            "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm cursor-pointer flex justify-between items-center transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500",
            isOpen && "ring-2 ring-indigo-500 border-indigo-500"
        )}
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearch(''); }}
      >
        <span className={selectedOption ? "text-gray-900 font-medium" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg bg-white shadow-xl border border-gray-100 max-h-60 overflow-hidden flex flex-col animate-fade-in">
            <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                <input
                    type="text"
                    className="w-full rounded-md border border-gray-200 py-1.5 px-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Type to filter..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <div className="overflow-y-auto flex-1 p-1">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => (
                        <div
                            key={opt.value}
                            className={cn(
                                "cursor-pointer px-3 py-2 text-sm rounded-md transition-colors",
                                opt.value === value 
                                    ? "bg-indigo-50 text-indigo-700 font-semibold" 
                                    : "text-gray-700 hover:bg-gray-50"
                            )}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center italic">No matching options</div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

// --- Modal ---
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
      md: 'sm:max-w-lg',
      lg: 'sm:max-w-2xl',
      xl: 'sm:max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        <div className={cn(
            "inline-block transform overflow-hidden rounded-3xl bg-white text-left align-bottom shadow-pop animate-pop-in sm:my-8 sm:w-full sm:align-middle border border-slate-200/80",
            sizeClasses[size]
        )}>
          <div className="bg-white px-5 pt-5 pb-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight font-display">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
