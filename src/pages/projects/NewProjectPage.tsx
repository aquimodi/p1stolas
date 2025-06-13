import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import ProjectForm from '../../components/project/ProjectForm';
import { useAppStore } from '../../store';

const NewProjectPage: React.FC = () => {
  const { addProject, addEstimatedEquipment } = useAppStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (projectData: any, equipmentList: any[]) => {
    setIsSubmitting(true);
    
    try {
      // Add the project
      addProject(projectData);
      
      // Wait for project to be created
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get the project from the store (to get the ID)
      const projects = useAppStore.getState().projects;
      const newProject = projects.find(p => p.projectCode === projectData.projectCode);
      
      if (newProject) {
        // Add estimated equipment to the project
        equipmentList.forEach(equipment => {
          addEstimatedEquipment(newProject.id, equipment);
        });
        
        // Navigate to the project detail page
        navigate(`/projects/${newProject.id}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error al crear el proyecto. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mr-4"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/projects')}
        >
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Proyecto</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <ProjectForm 
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default NewProjectPage;