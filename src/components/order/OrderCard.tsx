import React from 'react';
import { Link } from 'react-router-dom';
import { PackageCheck, ArrowRight, Package } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import { Order } from '../../types';

interface OrderCardProps {
  order: Order;
  projectId: string;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, projectId }) => {
  return (
    <Card 
      title={`Pedido: ${order.code}`}
      footer={
        <div className="flex justify-end">
          <Link to={`/projects/${projectId}/orders/${order.id}`}>
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
        <div className="flex items-center text-sm">
          <Package className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium mr-1">Equipos Estimados:</span>
          <span className="text-gray-600">{order.estimatedEquipment}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <PackageCheck className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium mr-1">Albaranes:</span>
          <span className="text-gray-600">{order.deliveryNotes.length}</span>
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm font-medium text-gray-700">{order.progress}%</span>
          </div>
          <ProgressBar 
            value={order.progress} 
            showPercentage={false}
          />
        </div>
      </div>
    </Card>
  );
};

export default OrderCard;