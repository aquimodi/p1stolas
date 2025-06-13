import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Calendar, Building, Download } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import StatusBadge from '../ui/StatusBadge';
import { Project } from '../../types';
import { formatDate, exportExcelFile } from '../../utils/helpers';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const handleExcelDownload = () => {
    // Mock implementation for downloading the Excel file
    // In a real app, this would fetch the file from an API or storage
    
    // For the demo, we'll just create a mock Excel
    const mockProjectData = {
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
    
    const mockEquipmentList = (project.estimatedEquipmentList || []).map(item => ({
      Type: item.type,
      Model: item.model,
      Quantity: item.quantity,
      Assigned: item.assignedEquipmentCount
    }));
    
    exportExcelFile(mockProjectData, mockEquipmentList);
  };
  
  return (
    <Card 
      title={project.projectName}
      headerAction={
        <StatusBadge status={project.status} />
      }
      footer={
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={handleExcelDownload}
          >
            Excel
          </Button>
          <Link to={`/projects/${project.id}`}>
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
          <FileText className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium mr-1">Código:</span>
          <span className="text-gray-600">{project.projectCode}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Building className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium mr-1">Cliente:</span>
          <span className="text-gray-600">{project.client}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Building className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium mr-1">Datacenter:</span>
          <span className="text-gray-600">{project.datacenter}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
          <span className="font-medium mr-1">Fecha de Entrega:</span>
          <span className="text-gray-600">{formatDate(project.deliveryDate)}</span>
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm font-medium text-gray-700">{project.progress}%</span>
          </div>
          <ProgressBar 
            value={project.progress} 
            showPercentage={false}
          />
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;