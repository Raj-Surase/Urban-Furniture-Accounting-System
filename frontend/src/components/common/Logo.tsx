import React from 'react';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false, ...props }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`} {...props}>
      {/* Sleek Gradient Pie Arc Logo matching Expected UI */}
      <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7042f4] via-[#9061f9] to-[#c084fc] shadow-[0_0_16px_rgba(112,66,244,0.4)]" />
        <div className="absolute inset-[3px] rounded-full bg-[#121216] flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-[#c084fc] via-[#7042f4] to-transparent opacity-90" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0, 100% 50%)' }} />
          <div className="absolute inset-1 rounded-full bg-[#18181f]/40 backdrop-blur-xs" />
        </div>
      </div>
      {!iconOnly && (
        <div className="flex flex-col text-left">
          <span className="font-bold text-base sm:text-lg leading-tight tracking-tight font-sans text-white">
            Urban Furniture
          </span>
          <span className="text-[10px] font-medium tracking-wider text-[#9090a0] uppercase leading-none mt-0.5">
            Accounting System
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
