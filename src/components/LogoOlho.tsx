

export const LogoOlho = ({ color, className }: { color?: string, className?: string }) => (
  <div className={className} style={{ backgroundColor: color || 'currentColor', borderRadius: '50%' }} />
);
