import React from 'react';
import { Package } from 'lucide-react';

// Import version from package.json
import pkg from '../../../package.json';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">© {new Date().getFullYear()} DataCenter Manager. Todos los derechos reservados.</p>
          </div>
          
          <div className="flex items-center text-gray-400 text-sm">
            <Package className="h-4 w-4 mr-2" />
            <span>Versión {pkg.version}</span>
          </div>
          
          <div className="flex space-x-4">
            <a href="#" className="text-gray-300 hover:text-white">
              Política de Privacidad
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              Términos de Servicio
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              Contacto
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;