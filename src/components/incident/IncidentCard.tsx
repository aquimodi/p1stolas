import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { Incident } from '../../types';
import { formatDate } from '../../utils/helpers';

interface IncidentCardProps {
  incident: Incident;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident }) => {
  return (
    <Card 
      title={`Incidencia #${incident.id.substring(0, 8)}`}
      headerAction={
        <StatusBadge status={incident.status} />
      }
      footer={
        <div className="flex justify-end">
          <Link to={`/incidents/${incident.id}`}>
            <Button
              size="sm"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Ver Detalles
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start text-sm">
          <AlertTriangle className="h-4 w-4 mr-1 text-red-500 mt-1 flex-shrink-0" />
          <p className="text-gray-700">{incident.description}</p>
        </div>
        
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium mr-1">Fecha:</span>
          <span className="text-gray-600">{formatDate(incident.createdAt)}</span>
        </div>
        
        {incident.photoPath && (
          <div className="mt-2">
            <img 
              src={incident.photoPath} 
              alt="Incidencia" 
              className="w-full h-40 object-cover rounded-md border border-gray-200" 
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default IncidentCard;