import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import { generateProjectCode } from '../../utils/helpers';
import { readExcelFile } from '../../services/fileService';
import { useSettingsStore } from '../../store/settingsStore';

const DATACENTERS = [
  { value: 'MAD', label: 'Madrid' },
  { value: 'BCN', label: 'Barcelona' },
  { value: 'PAR', label: 'París' },
  { value: 'LON', label: 'Londres' },
  { value: 'FRA', label: 'Frankfurt' },
  { value: 'AMS', label: 'Amsterdam' }
];

interface ProjectFormData {
  ritmCode: string;
  projectName: string;
  client: string;
  teamsUrl: string;
  datacenter: string;
  deliveryDate: string;
}

interface ProjectFormProps {
  onSubmit: (data: any, equipmentList: any[]) => void;
  isLoading?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, isLoading = false }) => {
  // Get settings from store
  const { settings } = useSettingsStore();
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, control } = useForm<ProjectFormData>({
    defaultValues: {
      deliveryDate: new Date().toISOString().split('T')[0]
    }
  });
  
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [previewCode, setPreviewCode] = useState<string>('');
  
  const datacenterValue = watch('datacenter');
  const clientValue = watch('client');
  const ritmCodeValue = watch('ritmCode');
  const projectNameValue = watch('projectName');
  
  React.useEffect(() => {
    if (datacenterValue && clientValue && ritmCodeValue && projectNameValue) {
      const code = generateProjectCode(
        datacenterValue,
        clientValue,
        ritmCodeValue,
        projectNameValue
      );
      setPreviewCode(code);
    }
  }, [datacenterValue, clientValue, ritmCodeValue, projectNameValue]);
  
  const handleFileChange = async (file: File) => {
    setExcelFile(file);
    try {
      const { equipmentList: parsedEquipment, projectData } = await readExcelFile(file);
      setEquipmentList(parsedEquipment);
      
      // Auto-fill form from Excel if available
      if (projectData) {
        if (projectData.RITM) setValue('ritmCode', projectData.RITM);
        if (projectData.ProjectName) setValue('projectName', projectData.ProjectName);
        if (projectData.Client) setValue('client', projectData.Client);
        if (projectData.Datacenter) setValue('datacenter', projectData.Datacenter);
        if (projectData.DeliveryDate) setValue('deliveryDate', projectData.DeliveryDate);
        if (projectData.TeamsUrl) setValue('teamsUrl', projectData.TeamsUrl);
      }
    } catch (error) {
      console.error('Error reading Excel file:', error);
    }
  };
  
  const handleFormSubmit = (data: ProjectFormData) => {
    if (!excelFile) {
      alert('Por favor, adjunta un archivo Excel con la información del proyecto');
      return;
    }
    
    const projectCode = generateProjectCode(
      data.datacenter,
      data.client,
      data.ritmCode,
      data.projectName
    );
    
    const projectData = {
      ...data,
      projectCode,
      status: 'Pendiente',
      estimatedEquipment: equipmentList.reduce((total, item) => total + item.quantity, 0),
      excelPath: excelFile.name,
      ocrMethod: settings.ocrMethod
    };
    
    onSubmit(projectData, equipmentList);
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Código RITM (ServiceNow)"
          {...register('ritmCode', { required: 'Este campo es obligatorio' })}
          error={errors.ritmCode?.message}
          fullWidth
        />
        
        <Input
          label="Nombre del Proyecto"
          {...register('projectName', { required: 'Este campo es obligatorio' })}
          error={errors.projectName?.message}
          fullWidth
        />
        
        <Input
          label="Cliente"
          {...register('client', { required: 'Este campo es obligatorio' })}
          error={errors.client?.message}
          fullWidth
        />
        
        <Controller
          name="datacenter"
          control={control}
          rules={{ required: 'Este campo es obligatorio' }}
          render={({ field }) => (
            <Select
              label="Datacenter"
              options={DATACENTERS}
              error={errors.datacenter?.message}
              fullWidth
              {...field}
            />
          )}
        />
        
        <Input
          label="Fecha de Entrega"
          type="date"
          {...register('deliveryDate', { required: 'Este campo es obligatorio' })}
          error={errors.deliveryDate?.message}
          fullWidth
        />
        
        <Input
          label="URL de Carpeta Teams"
          {...register('teamsUrl', { required: 'Este campo es obligatorio' })}
          error={errors.teamsUrl?.message}
          fullWidth
        />
      </div>
      
      {previewCode && (
        <div className="mt-4 p-3 bg-gray-50 rounded border">
          <p className="text-sm text-gray-600">Código de Proyecto (generado automáticamente):</p>
          <p className="text-lg font-mono font-bold mt-1">{previewCode}</p>
        </div>
      )}
      
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Archivo Excel con información del proyecto y equipos estimados:</p>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">Método de análisis:</span>
            <Select
              options={[
                { value: 'javascript', label: 'JavaScript' },
                { value: 'ai', label: 'Inteligencia Artificial' }
              ]}
              value={settings.excelParserMethod}
              onChange={(e) => useSettingsStore.getState().updateSettings({ excelParserMethod: e.target.value as 'javascript' | 'ai' })}
              className="text-xs py-0 h-6 pr-7 min-h-0"
            />
          </div>
        </div>
        <FileUpload 
          onFileChange={handleFileChange}
          accept={{
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
          }}
          label="Archivo Excel del Proyecto"
        />
        <p className="text-xs text-gray-500 mt-1">
          El método de OCR para análisis de albaranes se configura en los ajustes generales.
        </p>
      </div>
      
      {equipmentList.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Equipamiento estimado (del Excel):</h4>
          <div className="border rounded overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipmentList.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          fullWidth
        >
          {isLoading ? 'Creando...' : 'Crear Proyecto'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;