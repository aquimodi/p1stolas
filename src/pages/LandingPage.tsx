import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, BarChart3, Box, Building2, CheckCircle, Clock, Cloud, Database, 
  FileText, Mail, Package, Shield, Zap, LifeBuoy, CircleEllipsis, Truck, CheckSquare 
} from 'lucide-react';
import Button from '../components/ui/Button';

const LandingPage: React.FC = () => {
  const benefits = [
    {
      icon: <Zap className="h-8 w-8 text-red-500" />,
      title: "Automatización Inteligente",
      description: "Reduce el tiempo de procesamiento hasta un 80% con OCR inteligente y matching automático de equipos."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-500" />,
      title: "Control Total",
      description: "Seguimiento en tiempo real de cada equipo desde su llegada hasta su instalación en el datacenter."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-red-500" />,
      title: "Insights Actionables",
      description: "Métricas y análisis detallados para optimizar la gestión de tu datacenter."
    },
    {
      icon: <Clock className="h-8 w-8 text-red-500" />,
      title: "Ahorro de Tiempo",
      description: "Reduce el tiempo de procesamiento de albaranes en un 75% con nuestro sistema automatizado."
    },
    {
      icon: <Database className="h-8 w-8 text-red-500" />,
      title: "Integración DCIM",
      description: "Sincronización perfecta con tu sistema DCIM existente para una gestión unificada."
    },
    {
      icon: <Cloud className="h-8 w-8 text-red-500" />,
      title: "Siempre Disponible",
      description: "Acceso seguro desde cualquier lugar con autenticación empresarial Azure AD."
    }
  ];

  const features = [
    {
      icon: <FileText className="h-6 w-6 text-red-600" />,
      title: "Gestión de Proyectos",
      description: "Centraliza toda la información de tus proyectos en un solo lugar."
    },
    {
      icon: <Package className="h-6 w-6 text-red-600" />,
      title: "Control de Equipamiento",
      description: "Seguimiento detallado de cada equipo desde su recepción."
    },
    {
      icon: <Building2 className="h-6 w-6 text-red-600" />,
      title: "Multi-Datacenter",
      description: "Gestiona múltiples ubicaciones desde una única plataforma."
    }
  ];

  const stats = [
    { value: "75%", label: "Reducción en tiempo de procesamiento" },
    { value: "99.9%", label: "Precisión en verificación de equipos" },
    { value: "50%", label: "Menos incidencias no detectadas" },
    { value: "100%", label: "Trazabilidad de equipos" }
  ];

  const lifecycle = [
    {
      icon: <FileText className="h-6 w-6 text-red-500" />,
      title: "Ideación y Planificación",
      description: "Captura la información desde el nacimiento del proyecto"
    },
    {
      icon: <Truck className="h-6 w-6 text-red-500" />,
      title: "Adquisición y Compras",
      description: "Seguimiento de pedidos y proveedores"
    },
    {
      icon: <Box className="h-6 w-6 text-red-500" />,
      title: "Recepción y Validación",
      description: "Control de albaranes y verificación de equipos"
    },
    {
      icon: <CheckSquare className="h-6 w-6 text-red-500" />,
      title: "Integración con DCIM",
      description: "Traspaso fluido a sistemas de gestión de datacenter"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Asset Lifecycle */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Amplía el <span className="text-red-600">Ciclo de Vida</span> de tus Activos IT
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Automatización del proceso de recepción de hardware en el centro de datos y su integración en el DCIM corporativo para un mayor control del ciclo de vida de los activos. Esta solución permite gestionar las fases clave del ciclo de vida de los equipos, desde la ideación, planificación y adquisición, hasta la recepción física y verificación. Cubre etapas fundamentales que van más allá del alcance de las herramientas DCIM tradicionales, asegurando un control completo antes de que el equipo entre en producción.
              </p>
              <div className="flex space-x-4">
                <Link to="/home">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-4"
                    icon={<ArrowRight className="h-5 w-5" />}
                  >
                    Comienza Ahora
                  </Button>
                </Link>
                <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-4"
                    icon={<Mail className="h-5 w-5" />}
                  >
                    Solicitar Demo
                  </Button>
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-lg shadow-2xl overflow-hidden w-full" style={{ height: '70vh' }}>
                <img 
                  src="https://d37oebn0w9ir6a.cloudfront.net/account_24860/datacenterassetmanagement_24984c8b0a2aa9db1fa6a9459d306db3.jpg"
                  alt="DCIM Dashboard"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Decorative blobs */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 -right-10 w-40 h-40 bg-yellow-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>
          </div>
          
          {/* Lifecycle Steps */}
          <div className="mt-20 mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
              Control del Ciclo de Vida Completo del Activo IT
            </h2>
            
            <div className="max-w-5xl mx-auto">
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-red-200 transform -translate-y-1/2 z-0"></div>
                
                {/* Steps */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                  {lifecycle.map((step, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-lg p-6 transform transition-transform hover:scale-105">
                      <div className="rounded-full bg-red-100 p-3 inline-flex mb-4">
                        {step.icon}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                      <div className="absolute top-8 right-6 bg-red-100 text-red-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* DCIM Integration Note */}
                <div className="mt-8 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    <CircleEllipsis className="h-4 w-4 mr-1" />
                    <span>Donde termina nuestra solución, comienza tu DCIM</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parallax Dark Hero Section */}
      <div className="relative h-[500px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-center bg-cover z-0 bg-fixed"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1733036363190-fd1f5410d9f2?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
            filter: 'brightness(0.4)'
          }}
        ></div>
        
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center text-white max-w-4xl px-4">
            <h2 className="text-5xl font-bold mb-6">Transforma la Gestión de tus Activos de Datacenter</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              La única plataforma que cubre todo el ciclo de vida, desde la concepción del activo hasta su integración en tu DCIM.
            </p>
            <Link to="/home">
              <Button
                variant="primary"
                size="lg"
                className="text-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                Descubre Cómo Funciona
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-red-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-red-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Beneficios que Transforman tu Operación
            </h2>
            <p className="text-xl text-gray-600">
              Descubre cómo nuestra plataforma revoluciona la gestión de datacenters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Todo lo que Necesitas para una Gestión Eficiente
              </h2>
              <div className="space-y-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                      {feature.icon}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
                  alt="Datacenter Management"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-red-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              Comienza a Optimizar tu Datacenter Hoy
            </h2>
            <div className="flex justify-center space-x-4">
              <Link to="/home">
                <Button
                  variant="secondary"
                  size="lg"
                  className="text-lg px-8 py-4"
                  icon={<ArrowRight className="h-5 w-5" />}
                >
                  Prueba Gratuita
                </Button>
              </Link>
              <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 bg-transparent border-white text-white hover:bg-white hover:text-red-600"
                  icon={<Mail className="h-5 w-5" />}
                >
                  Solicitar Demo
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Lo que Dicen Nuestros Clientes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Hemos reducido el tiempo de procesamiento de albaranes en un 75%. Una herramienta imprescindible.",
                author: "María González",
                role: "Directora de Operaciones, TechData"
              },
              {
                quote: "La integración con nuestro DCIM fue perfecta. Ahora tenemos una visibilidad total de nuestro equipamiento.",
                author: "Carlos Rodríguez",
                role: "IT Manager, DataCloud"
              },
              {
                quote: "El soporte de IA para la verificación de equipos ha eliminado prácticamente todos los errores humanos.",
                author: "Ana Martínez",
                role: "Supervisora de Datacenter, NetCenter"
              }
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="bg-gray-50 p-8 rounded-xl shadow-sm"
              >
                <div className="flex items-center mb-6">
                  <CheckCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;