export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface border border-[#334155] rounded-2xl shadow-xl transition-shadow duration-300 hover:shadow-accent/5 p-5 relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
};
