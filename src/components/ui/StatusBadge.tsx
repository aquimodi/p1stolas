import React from 'react';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: 'Pendiente' | 'En Progreso' | 'Completado' | 'En Revisión' | 'Resuelto' | 'Validando Albarán' | 'Validando Recepción';
  size?: 'sm' | 'md';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'En Progreso':
        return 'bg-blue-100 text-blue-800';
      case 'Completado':
        return 'bg-green-100 text-green-800';
      case 'En Revisión':
        return 'bg-purple-100 text-purple-800';
      case 'Resuelto':
        return 'bg-green-100 text-green-800';
      case 'Validando Albarán':
        return 'bg-blue-100 text-blue-800';
      case 'Validando Recepción':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
  
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        getStatusColor(),
        sizeClasses[size],
        className
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;