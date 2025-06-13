import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { Incident } from '../../types';
import { formatDate } from '../../utils/helpers';

interface IncidentsListProps {
  incidents: Incident[];
  title?: string;
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
}

const IncidentsList: React.FC<IncidentsListProps> = ({
  incidents,
  title = 'Incidencias',
  emptyMessage = 'No hay incidencias registradas',
  className = '',
  compact = false
}) => {
  if (incidents.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 text-center text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      
      <div className={`space-y-4 ${compact ? 'text-sm' : ''}`}>
        {incidents.map((incident) => (
          <Card 
            key={incident.id}
            className={`border-l-4 border-l-red-500 ${compact ? 'p-2' : ''}`}
          >
            <div className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`font-medium ${compact ? 'mb-1' : 'mb-2'}`}>
                      Incidencia #{incident.id.substring(0, 6)}
                    </p>
                    <p className={`text-gray-700 ${compact ? 'line-clamp-2' : ''}`}>
                      {incident.description}
                    </p>
                  </div>
                </div>
                
                <StatusBadge 
                  status={incident.status} 
                  size="sm"
                />
              </div>
              
              <div className={`flex justify-between items-center ${compact ? 'mt-2' : 'mt-4'}`}>
                <span className="text-gray-500 text-sm">
                  {formatDate(incident.createdAt)}
                </span>
                
                <Link to={`/incidents/${incident.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ExternalLink className="h-4 w-4" />}
                  >
                    {compact ? 'Ver' : 'Ver detalles'}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IncidentsList;