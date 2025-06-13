import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Input from '../../components/ui/Input';
import IncidentCard from '../../components/incident/IncidentCard';
import Select from '../../components/ui/Select';
import { useAppStore } from '../../store';

const IncidentsPage: React.FC = () => {
  const { incidents } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch = 
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      incident.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Incidencias</h1>
        <p className="text-lg text-gray-600">Gestión de incidencias en la recepción de equipos</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              placeholder="Buscar incidencias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              className="mb-0"
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>
          
          <div>
            <Select
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'en revisión', label: 'En Revisión' },
                { value: 'resuelto', label: 'Resuelto' }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mb-0"
              fullWidth
            />
          </div>
        </div>
      </div>
      
      {filteredIncidents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">No se encontraron incidencias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIncidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentsPage;