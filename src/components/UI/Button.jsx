export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 focus:ring-accent/50",
    secondary: "bg-surface hover:bg-[#334155] text-white border border-[#334155] focus:ring-[#334155]/50",
    danger: "bg-danger hover:bg-danger/90 text-white shadow-lg shadow-danger/20 focus:ring-danger/50",
    success: "bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20 focus:ring-success/50",
    ghost: "text-gray-400 hover:text-white hover:bg-[#334155]/50"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  }

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[props.size || 'md']} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
