import React, { useState, useEffect } from 'react';
import { Send, Download, CheckCircle, FileText, Eye } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Project } from '../../types';
import { exportExcelFile } from '../../services/fileService';

interface SendToDCIMProps {
  project: Project;
  onSendToDCIM: () => void;
  isAllVerified: boolean;
  isSent: boolean;
}

const SendToDCIM: React.FC<SendToDCIMProps> = ({
  project,
  onSendToDCIM,
  isAllVerified,
  isSent
}) => {
  const [isSending, setIsSending] = useState(false);
  const [excelGenerated, setExcelGenerated] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [excelData, setExcelData] = useState<any>({
    projectData: {},
    equipmentList: []
  });
  
  useEffect(() => {
    // Reset excel generated status when verification status changes
    setExcelGenerated(false);
  }, [isAllVerified]);
  
  const generateExcelData = () => {
    // Create project data object
    const projectData = {
      projectCode: project.projectCode,
      projectName: project.projectName,
      client: project.client,
      datacenter: project.datacenter,
      ritmCode: project.ritmCode,
      deliveryDate: project.deliveryDate,
      status: project.status,
      progress: project.progress,
      createdAt: project.createdAt
    };
    
    // Create a list of all verified equipment
    const allEquipment: any[] = [];
    project.orders.forEach(order => {
      order.deliveryNotes.forEach(note => {
        note.equipments.forEach(equipment => {
          if (equipment.isVerified) {
            allEquipment.push({
              Name: equipment.name,
              Type: equipment.type,
              Model: equipment.model,
              SerialNumber: equipment.serialNumber,
              PartNumber: equipment.partNumber,
              DeviceName: equipment.deviceName
            });
          }
        });
      });
    });
    
    return { projectData, equipmentList: allEquipment };
  };
  
  const handleExportExcel = () => {
    // Generate Excel data
    const data = generateExcelData();
    setExcelData(data);
    setExcelGenerated(true);
    
    // Export the Excel file
    exportExcelFile(data.projectData, data.equipmentList);
  };
  
  const handlePreviewExcel = () => {
    // Generate Excel data if not already done
    if (!excelGenerated) {
      const data = generateExcelData();
      setExcelData(data);
      setExcelGenerated(true);
    }
    
    // Toggle preview visibility
    setPreviewVisible(!previewVisible);
  };
  
  const handleSendToDCIM = async () => {
    if (!excelGenerated) {
      alert('Por favor, genera primero el Excel antes de enviar al DCIM.');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      onSendToDCIM();
    } catch (error) {
      console.error('Error sending to DCIM:', error);
      alert('Error al enviar al DCIM. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Enviar al DCIM</h3>
      </div>
      
      <Card>
        <div className="p-4 space-y-6">
          <div className="flex items-center mb-4">
            <div className="rounded-full h-10 w-10 flex items-center justify-center bg-red-100 text-red-600 mr-4">
              1
            </div>
            <div>
              <h4 className="font-medium">Exportar Excel Actualizado</h4>
              <p className="text-sm text-gray-600">Descarga el Excel con toda la información actualizada de los equipos verificados</p>
            </div>
            <div className="ml-auto flex space-x-2">
              <Button
                variant="outline"
                icon={<Eye className="h-4 w-4" />}
                onClick={handlePreviewExcel}
              >
                {previewVisible ? 'Ocultar Datos' : 'Previsualizar'}
              </Button>
              <Button
                variant="outline"
                icon={<Download className="h-4 w-4" />}
                onClick={handleExportExcel}
              >
                Descargar Excel
              </Button>
            </div>
          </div>
          
          {previewVisible && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
              <h5 className="text-sm font-medium mb-2">Vista previa de datos</h5>
              <div className="mb-3">
                <h6 className="text-xs font-semibold text-gray-700 mb-1">Información del Proyecto:</h6>
                <div className="bg-white p-2 rounded border text-xs">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(excelData.projectData, null, 2)}
                  </pre>
                </div>
              </div>
              
              <h6 className="text-xs font-semibold text-gray-700 mb-1">Equipos Verificados ({excelData.equipmentList.length}):</h6>
              <div className="bg-white p-2 rounded border overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-2 py-1 text-left">Nombre</th>
                      <th className="px-2 py-1 text-left">Tipo</th>
                      <th className="px-2 py-1 text-left">Modelo</th>
                      <th className="px-2 py-1 text-left">Número de Serie</th>
                      <th className="px-2 py-1 text-left">Device Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.equipmentList.slice(0, 10).map((item: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="px-2 py-1">{item.Name}</td>
                        <td className="px-2 py-1">{item.Type}</td>
                        <td className="px-2 py-1">{item.Model}</td>
                        <td className="px-2 py-1">{item.SerialNumber}</td>
                        <td className="px-2 py-1">{item.DeviceName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {excelData.equipmentList.length > 10 && (
                  <p className="text-xs text-gray-500 p-2">
                    Mostrando 10 de {excelData.equipmentList.length} equipos. Descarga el Excel para ver todos.
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex items-center">
            <div className="rounded-full h-10 w-10 flex items-center justify-center bg-red-100 text-red-600 mr-4">
              2
            </div>
            <div>
              <h4 className="font-medium">Enviar al DCIM</h4>
              <p className="text-sm text-gray-600">Envía la información actualizada al sistema DCIM</p>
            </div>
            {isSent ? (
              <div className="ml-auto flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Enviado</span>
              </div>
            ) : (
              <Button
                variant="primary"
                className="ml-auto"
                icon={<Send className="h-4 w-4" />}
                onClick={handleSendToDCIM}
                disabled={!isAllVerified || isSending || !excelGenerated}
              >
                {isSending ? 'Enviando...' : 'Enviar al DCIM'}
              </Button>
            )}
          </div>
          
          {!isAllVerified && !isSent && (
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
              Todos los equipos deben ser verificados antes de enviar al DCIM.
            </div>
          )}
          
          {!excelGenerated && isAllVerified && !isSent && (
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
              Debes generar y revisar el Excel antes de enviar al DCIM.
            </div>
          )}
          
          {isSent && (
            <div className="bg-green-50 p-3 rounded border border-green-200 text-sm text-green-800">
              La información ha sido enviada correctamente al DCIM.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SendToDCIM;