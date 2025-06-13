import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';

interface DeliveryNoteFormData {
  code: string;
  estimatedEquipment: number;
}

interface DeliveryNoteFormProps {
  onSubmit: (data: DeliveryNoteFormData, file: File | null) => void;
  isLoading?: boolean;
}

const DeliveryNoteForm: React.FC<DeliveryNoteFormProps> = ({ onSubmit, isLoading = false }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<DeliveryNoteFormData>();
  const [file, setFile] = useState<File | null>(null);
  
  const handleFileChange = (uploadedFile: File) => {
    setFile(uploadedFile);
  };
  
  const handleFormSubmit = (data: DeliveryNoteFormData) => {
    // No longer requiring file to be present
    onSubmit(data, file);
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Código del Albarán"
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
        
        <div className="mt-2">
          <p className="text-sm text-gray-600 mb-2">Adjuntar documento del albarán (opcional):</p>
          <FileUpload 
            onFileChange={handleFileChange}
            accept={{
              'application/pdf': ['.pdf'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/png': ['.png']
            }}
            label="Documento del Albarán"
          />
          <p className="text-xs text-gray-500 mt-2">
            Puede adjuntar el documento más tarde si no está disponible ahora.
          </p>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          fullWidth
        >
          {isLoading ? 'Creando...' : 'Añadir Albarán'}
        </Button>
      </div>
    </form>
  );
};

export default DeliveryNoteForm;