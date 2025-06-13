import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Package, Clipboard, FileText, Menu, X, Settings, User, LogOut, ChevronDown } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import ApiStatusIndicator from './ApiStatusIndicator';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useUserStore();
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };
  
  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
    setIsProfileOpen(false);
  };
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  return (
    <nav className="bg-red-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8" />
              <span className="text-xl font-bold">DataCenter Manager</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/home" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/home') ? 'bg-red-900' : 'hover:bg-red-600'}`}
            >
              <div className="flex items-center space-x-1">
                <Home className="h-5 w-5" />
                <span>Inicio</span>
              </div>
            </Link>
            
            <Link 
              to="/projects" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/projects') ? 'bg-red-900' : 'hover:bg-red-600'}`}
            >
              <div className="flex items-center space-x-1">
                <FileText className="h-5 w-5" />
                <span>Proyectos</span>
              </div>
            </Link>
            
            <Link 
              to="/incidents" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/incidents') ? 'bg-red-900' : 'hover:bg-red-600'}`}
            >
              <div className="flex items-center space-x-1">
                <Clipboard className="h-5 w-5" />
                <span>Incidencias</span>
              </div>
            </Link>
            
            <Link 
              to="/settings" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/settings') ? 'bg-red-900' : 'hover:bg-red-600'}`}
            >
              <div className="flex items-center space-x-1">
                <Settings className="h-5 w-5" />
                <span>Ajustes</span>
              </div>
            </Link>
            
            {/* API Status Indicator */}
            <div className="px-3 py-2">
              <ApiStatusIndicator />
            </div>
            
            {/* User profile dropdown */}
            <div className="relative ml-3">
              <div>
                <button
                  onClick={toggleProfile}
                  className="flex items-center space-x-2 rounded-full text-sm focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-white">
                    <img 
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                      alt={currentUser?.name || 'Usuario'} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="hidden lg:block">{currentUser?.name || 'Usuario'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1 px-3 rounded-t-md bg-gray-50 border-b">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span>Mi Perfil</span>
                      </div>
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Cerrar Sesión</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {/* API Status Indicator */}
            <ApiStatusIndicator showLabel={false} className="mr-3" />
            
            {/* Mobile user avatar */}
            <button
              onClick={toggleProfile}
              className="mr-2 flex items-center rounded-full"
            >
              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-white">
                <img 
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                  alt={currentUser?.name || 'Usuario'} 
                  className="h-full w-full object-cover"
                />
              </div>
            </button>
            
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-red-600 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile profile dropdown */}
      {isProfileOpen && (
        <div className="md:hidden absolute right-4 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          <div className="py-1 px-3 rounded-t-md bg-gray-50 border-b">
            <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name}</p>
            <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
          </div>
          <div className="py-1">
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsProfileOpen(false)}
            >
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>Mi Perfil</span>
              </div>
            </Link>
            <button
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <div className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Cerrar Sesión</span>
              </div>
            </button>
          </div>
        </div>
      )}
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'bg-red-900' : 'hover:bg-red-600'}`}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Inicio</span>
              </div>
            </Link>
            <Link 
              to="/projects" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/projects') ? 'bg-red-900' : 'hover:bg-red-600'}`}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Proyectos</span>
              </div>
            </Link>
            <Link 
              to="/incidents" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/incidents') ? 'bg-red-900' : 'hover:bg-red-600'}`}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center space-x-2">
                <Clipboard className="h-5 w-5" />
                <span>Incidencias</span>
              </div>
            </Link>
            <Link 
              to="/settings" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/settings') ? 'bg-red-900' : 'hover:bg-red-600'}`}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Ajustes</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;