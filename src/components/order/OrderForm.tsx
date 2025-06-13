import React from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface OrderFormData {
  code: string;
  estimatedEquipment: number;
}

interface OrderFormProps {
  onSubmit: (data: OrderFormData) => void;
  isLoading?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSubmit, isLoading = false }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<OrderFormData>();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Código del Pedido"
          {...register('code', { required: 'Este campo es obligatorio' })}
          error={errors.code?.message}
          fullWidth
        />
        
        <Input
          label="Equipos Estimados"
          type="number"
          {...register('estimatedEquipment', { 
            required: 'Este campo es obligatorio',
            min: { value: 1, message: 'El valor debe ser mayor a 0' },
            valueAsNumber: true
          })}
          error={errors.estimatedEquipment?.message}
          fullWidth
        />
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          fullWidth
        >
          {isLoading ? 'Creando...' : 'Añadir Pedido'}
        </Button>
      </div>
    </form>
  );
};

export default OrderForm;