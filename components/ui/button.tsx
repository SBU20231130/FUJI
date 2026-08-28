import type { ButtonHTMLAttributes, ReactNode } from 'react';

export default function Button({ children, variant = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; className?: string }) {
  return <button className={`ui-button ui-button--${variant} ${className}`.trim()} {...props}>{children}</button>;
}
