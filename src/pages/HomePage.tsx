import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, FileText, Clipboard, ArrowRight, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAppStore } from '../store';

const HomePage: React.FC = () => {
  const { projects } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter projects based on search term
  const filteredProjects = searchTerm
    ? projects.filter(project => 
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.datacenter.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : projects;
  
  const pendingProjects = projects.filter(p => p.status !== 'Completado');
  const completedProjects = projects.filter(p => p.status === 'Completado');
  
  // Count total equipment
  let totalEquipment = 0;
  let verifiedEquipment = 0;
  
  projects.forEach(project => {
    project.orders.forEach(order => {
      order.deliveryNotes.forEach(note => {
        totalEquipment += note.deliveredEquipment;
        verifiedEquipment += note.verifiedEquipment;
      });
    });
  });
  
  const stats = [
    {
      id: 1,
      name: 'Proyectos Activos',
      value: pendingProjects.length,
      icon: <FileText className="h-6 w-6 text-red-600" />,
      href: '/projects',
    },
    {
      id: 2,
      name: 'Proyectos Completados',
      value: completedProjects.length,
      icon: <FileText className="h-6 w-6 text-green-600" />,
      href: '/projects',
    },
    {
      id: 3,
      name: 'Equipos Recepcionados',
      value: verifiedEquipment,
      icon: <Package className="h-6 w-6 text-blue-600" />,
      href: '/projects',
    },
    {
      id: 4,
      name: 'Equipos Pendientes',
      value: totalEquipment - verifiedEquipment,
      icon: <Package className="h-6 w-6 text-yellow-600" />,
      href: '/projects',
    },
  ];
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Datacenters</h1>
        <p className="text-lg text-gray-600 mb-6">Sistema de gestión para recepción de hardware en datacenters</p>
        
        {/* Global Search Bar */}
        <div className="mb-8">
          <div className="max-w-3xl mx-auto">
            <Input
              placeholder="Buscar proyectos por nombre, cliente o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              className="text-lg py-6"
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.id} className="border border-gray-200">
            <div className="p-4 flex items-center">
              <div className="rounded-full bg-gray-50 p-3 mr-4">
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.name}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {searchTerm ? (
        // Search Results
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Resultados de búsqueda</h2>
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No se encontraron proyectos que coincidan con "{searchTerm}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id}
                  title={project.projectName}
                  footer={
                    <div className="flex justify-end">
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
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="font-medium mr-1">Cliente:</span>
                      <span className="text-gray-600">{project.client}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="font-medium mr-1">Datacenter:</span>
                      <span className="text-gray-600">{project.datacenter}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="font-medium mr-1">Código:</span>
                      <span className="text-gray-600">{project.projectCode}</span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Progreso</span>
                        <span className="text-sm font-medium text-gray-700">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="rounded-full bg-red-600" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card 
              title="Proyectos Recientes"
              footer={
                <div className="flex justify-end">
                  <Link to="/projects">
                    <Button
                      size="sm"
                      icon={<ArrowRight className="h-4 w-4" />}
                    >
                      Ver Todos
                    </Button>
                  </Link>
                </div>
              }
            >
              {projects.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No hay proyectos creados todavía.</p>
                  <Link to="/projects/new" className="text-red-600 hover:text-red-700 mt-2 inline-block">
                    Crear tu primer proyecto
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="py-3">
                      <Link to={`/projects/${project.id}`} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded">
                        <div>
                          <p className="font-medium text-gray-900">{project.projectName}</p>
                          <p className="text-sm text-gray-500">{project.client} - {project.datacenter}</p>
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          project.status === 'Completado' 
                            ? 'bg-green-100 text-green-800' 
                            : project.status === 'En Progreso'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status}
                        </span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            
            <Card 
              title="Acciones Rápidas"
            >
              <div className="grid grid-cols-1 gap-4 p-2">
                <Link to="/projects/new">
                  <Button
                    variant="primary"
                    fullWidth
                    className="justify-start"
                    icon={<FileText className="h-5 w-5" />}
                  >
                    Crear Nuevo Proyecto
                  </Button>
                </Link>
                
                {pendingProjects.length > 0 && (
                  <Link to={`/projects/${pendingProjects[0].id}`}>
                    <Button
                      variant="outline"
                      fullWidth
                      className="justify-start"
                      icon={<Package className="h-5 w-5" />}
                    >
                      Gestionar Último Proyecto
                    </Button>
                  </Link>
                )}
                
                <Link to="/incidents">
                  <Button
                    variant="outline"
                    fullWidth
                    className="justify-start"
                    icon={<Clipboard className="h-5 w-5" />}
                  >
                    Ver Incidencias
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;