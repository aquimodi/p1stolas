import React, { useState } from 'react';
import { Shield, User, MapPin, Mail, Calendar, Building, History, Edit, Save, Camera } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useUserStore } from '../store/userStore';
import { formatDate } from '../utils/helpers';

const ProfilePage: React.FC = () => {
  const { currentUser, updateUser, userGroups } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    location: currentUser?.location || '',
    department: currentUser?.department || '',
  });
  
  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">Usuario no encontrado o sesión expirada</p>
        </div>
      </div>
    );
  }
  
  const userGroup = userGroups.find(g => g.id === currentUser.userGroupId);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = () => {
    updateUser(currentUser.id, formData);
    setIsEditing(false);
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'technician':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu información personal y preferencias</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="border border-gray-200">
            <div className="p-6 flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow">
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute bottom-4 right-0 bg-white rounded-full p-2 shadow hover:bg-gray-100">
                  <Camera className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
              <p className="text-gray-600">{currentUser.email}</p>
              
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(currentUser.role)}`}>
                  {currentUser.role === 'admin' && 'Administrador'}
                  {currentUser.role === 'manager' && 'Supervisor'}
                  {currentUser.role === 'technician' && 'Técnico'}
                  {currentUser.role === 'viewer' && 'Visualizador'}
                </span>
              </div>
              
              <div className="mt-6 w-full">
                <div className="mb-4 flex items-center">
                  <Shield className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Grupo de Usuario</p>
                    <p className="text-sm text-gray-600">{userGroup?.name || 'Sin grupo'}</p>
                  </div>
                </div>
                
                <div className="mb-4 flex items-center">
                  <History className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Último acceso</p>
                    <p className="text-sm text-gray-600">{formatDate(currentUser.lastLogin)}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 w-full">
                <Button 
                  variant="outline" 
                  icon={isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />} 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  fullWidth
                >
                  {isEditing ? 'Guardar Cambios' : 'Editar Perfil'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card className="border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
              
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    label="Nombre"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    icon={<User className="h-5 w-5 text-gray-400" />}
                    fullWidth
                  />
                  
                  <Input
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    icon={<Mail className="h-5 w-5 text-gray-400" />}
                    fullWidth
                  />
                  
                  <Input
                    label="Departamento"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    icon={<Building className="h-5 w-5 text-gray-400" />}
                    fullWidth
                  />
                  
                  <Input
                    label="Ubicación"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    icon={<MapPin className="h-5 w-5 text-gray-400" />}
                    fullWidth
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nombre</p>
                      <p className="mt-1">{currentUser.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1">{currentUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Departamento</p>
                      <p className="mt-1">{currentUser.department}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ubicación</p>
                      <p className="mt-1">{currentUser.location}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Permisos del Grupo "{userGroup?.name}"</h3>
              
              {userGroup?.permissions.length > 0 ? (
                <div className="space-y-2">
                  {userGroup.permissions.map((permission) => (
                    <div 
                      key={permission.id} 
                      className="flex items-center p-2 border border-gray-200 rounded-md"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{permission.description}</p>
                        <p className="text-sm text-gray-500">{permission.resource} - {permission.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay permisos asignados a este grupo.</p>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                <p>Los permisos son administrados por el administrador del sistema. Contacta con el administrador si necesitas modificar tus permisos.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;