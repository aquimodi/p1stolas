import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, CheckSquare, PackageCheck, Download, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import StatusBadge from '../ui/StatusBadge';
import { DeliveryNote } from '../../types';

interface DeliveryNoteCardProps {
  deliveryNote: DeliveryNote;
  projectId: string;
  orderId: string;
}

const DeliveryNoteCard: React.FC<DeliveryNoteCardProps> = ({ deliveryNote, projectId, orderId }) => {
  const handleAttachmentDownload = () => {
    // Mock implementation for downloading the attachment
    if (deliveryNote.attachmentPath) {
      alert(`Descargando albarán: ${deliveryNote.code}`);
    } else {
      alert('Este albarán no tiene documento adjunto.');
    }
  };
  
  return (
    <Card 
      title={`Albarán: ${deliveryNote.code}`}
      headerAction={
        <StatusBadge status={deliveryNote.status} />
      }
      footer={
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            icon={deliveryNote.attachmentPath ? <Download className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            onClick={handleAttachmentDownload}
          >
            {deliveryNote.attachmentPath ? 'Adjunto' : 'Sin adjunto'}
          </Button>
          <Link to={`/projects/${projectId}/orders/${orderId}/deliveryNotes/${deliveryNote.id}`}>
            <Button
              size="sm"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Gestionar
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center text-sm">
          <FileText className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium mr-1">Código:</span>
          <span className="text-gray-600">{deliveryNote.code}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <PackageCheck className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium mr-1">Equipos Estimados:</span>
          <span className="text-gray-600">{deliveryNote.estimatedEquipment}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <CheckSquare className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium mr-1">Equipos Verificados:</span>
          <span className="text-gray-600">{deliveryNote.verifiedEquipment} de {deliveryNote.deliveredEquipment}</span>
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm font-medium text-gray-700">{deliveryNote.progress}%</span>
          </div>
          <ProgressBar 
            value={deliveryNote.progress} 
            showPercentage={false}
          />
        </div>
      </div>
    </Card>
  );
};

export default DeliveryNoteCard;