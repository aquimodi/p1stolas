import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'red' | 'green' | 'blue' | 'yellow';
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  color: propColor,
  className
}) => {
  const percentage = Math.round((value / max) * 100);
  
  // If progress is 100% and no color is explicitly provided, use green
  const color = percentage === 100 && !propColor ? 'green' : propColor || 'red';
  
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4'
  };
  
  const colorClasses = {
    red: 'bg-red-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    yellow: 'bg-yellow-600'
  };
  
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">{percentage}%</span>
          )}
        </div>
      )}
      <div className={clsx('w-full bg-gray-200 rounded-full overflow-hidden', heightClasses[size])}>
        <div 
          className={clsx('rounded-full transition-all duration-300', colorClasses[color])} 
          style={{ width: `${percentage}%`, height: '100%' }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          {size === 'lg' && showPercentage && percentage > 5 && (
            <span className="text-xs text-white px-2 flex items-center h-full">{percentage}%</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;