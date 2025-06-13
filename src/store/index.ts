import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Project, 
  Order, 
  DeliveryNote, 
  Equipment, 
  Incident, 
  EstimatedEquipment, 
  DeviceNameDB,
  IncidentComment
} from '../types';
import { 
  generateProjectCode, 
  calculateProjectProgress, 
  calculateOrderProgress, 
  calculateDeliveryNoteProgress,
  generateUniqueId,
  getNextDeviceName
} from '../utils/helpers';

interface AppState {
  projects: Project[];
  incidents: Incident[];
  deviceNameDB: DeviceNameDB[];
  
  addProject: (projectData: Omit<Project, 'id' | 'projectCode' | 'progress' | 'createdAt' | 'orders'>) => void;
  updateProject: (projectId: string, projectData: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  
  addOrder: (projectId: string, orderData: Omit<Order, 'id' | 'projectId' | 'progress' | 'deliveryNotes'>) => void;
  updateOrder: (orderId: string, orderData: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  
  addDeliveryNote: (orderId: string, noteData: Omit<DeliveryNote, 'id' | 'orderId' | 'progress' | 'deliveredEquipment' | 'verifiedEquipment' | 'equipments'>) => void;
  updateDeliveryNote: (noteId: string, noteData: Partial<DeliveryNote>) => void;
  deleteDeliveryNote: (noteId: string) => void;
  
  addEquipment: (deliveryNoteId: string, equipmentData: Omit<Equipment, 'id' | 'deliveryNoteId' | 'isVerified' | 'isMatched' | 'matchedWithId' | 'estimatedEquipmentId'>) => void;
  updateEquipment: (equipmentId: string, equipmentData: Partial<Equipment>) => void;
  deleteEquipment: (equipmentId: string) => void;
  
  addEstimatedEquipment: (projectId: string, equipmentData: Omit<EstimatedEquipment, 'id' | 'projectId' | 'assignedEquipmentCount'>) => void;
  
  matchEquipment: (equipmentId: string, estimatedEquipmentId: string) => void;
  unmatchEquipment: (equipmentId: string) => void;
  
  verifyEquipment: (equipmentId: string, photoPath: string) => void;
  
  addIncident: (incidentData: Omit<Incident, 'id' | 'createdAt'>) => void;
  updateIncident: (incidentId: string, incidentData: Partial<Incident>) => void;
  addIncidentComment: (incidentId: string, comment: Omit<IncidentComment, 'id' | 'date'>) => void;
  
  generateDeviceName: (datacenter: string) => string;
  getProjectById: (projectId: string) => Project | undefined;
  getOrderById: (orderId: string) => Order | undefined;
  getDeliveryNoteById: (noteId: string) => DeliveryNote | undefined;
  getEstimatedEquipmentByProjectId: (projectId: string) => EstimatedEquipment[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      incidents: [],
      deviceNameDB: [
        { id: '1', prefix: 'SRV', datacenter: 'MAD', lastNumber: 1000 },
        { id: '2', prefix: 'SRV', datacenter: 'BCN', lastNumber: 1000 },
        { id: '3', prefix: 'SRV', datacenter: 'PAR', lastNumber: 1000 },
        { id: '4', prefix: 'SRV', datacenter: 'LON', lastNumber: 1000 },
        { id: '5', prefix: 'SRV', datacenter: 'FRA', lastNumber: 1000 },
        { id: '6', prefix: 'SRV', datacenter: 'AMS', lastNumber: 1000 },
        { id: '7', prefix: 'SW', datacenter: 'MAD', lastNumber: 1000 },
        { id: '8', prefix: 'SW', datacenter: 'BCN', lastNumber: 1000 },
        { id: '9', prefix: 'SW', datacenter: 'PAR', lastNumber: 1000 },
        { id: '10', prefix: 'SW', datacenter: 'LON', lastNumber: 1000 },
        { id: '11', prefix: 'SW', datacenter: 'FRA', lastNumber: 1000 },
        { id: '12', prefix: 'SW', datacenter: 'AMS', lastNumber: 1000 },
        { id: '13', prefix: 'RT', datacenter: 'MAD', lastNumber: 1000 },
        { id: '14', prefix: 'RT', datacenter: 'BCN', lastNumber: 1000 },
        { id: '15', prefix: 'RT', datacenter: 'PAR', lastNumber: 1000 },
        { id: '16', prefix: 'RT', datacenter: 'LON', lastNumber: 1000 },
        { id: '17', prefix: 'RT', datacenter: 'FRA', lastNumber: 1000 },
        { id: '18', prefix: 'RT', datacenter: 'AMS', lastNumber: 1000 },
        { id: '19', prefix: 'STG', datacenter: 'MAD', lastNumber: 1000 },
        { id: '20', prefix: 'STG', datacenter: 'BCN', lastNumber: 1000 },
        { id: '21', prefix: 'STG', datacenter: 'PAR', lastNumber: 1000 },
        { id: '22', prefix: 'STG', datacenter: 'LON', lastNumber: 1000 },
        { id: '23', prefix: 'STG', datacenter: 'FRA', lastNumber: 1000 },
        { id: '24', prefix: 'STG', datacenter: 'AMS', lastNumber: 1000 },
      ],
      
      addProject: (projectData) => {
        const projectCode = generateProjectCode(
          projectData.datacenter,
          projectData.client,
          projectData.ritmCode,
          projectData.projectName
        );
        
        const newProject: Project = {
          id: generateUniqueId(),
          projectCode,
          progress: 0,
          createdAt: new Date().toISOString(),
          orders: [],
          ...projectData
        };
        
        set((state) => ({
          projects: [...state.projects, newProject]
        }));
      },
      
      updateProject: (projectId, projectData) => {
        set((state) => ({
          projects: state.projects.map((project) => 
            project.id === projectId 
              ? { ...project, ...projectData, progress: calculateProjectProgress({...project, ...projectData}) }
              : project
          )
        }));
      },
      
      deleteProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId)
        }));
      },
      
      addOrder: (projectId, orderData) => {
        const newOrder: Order = {
          id: generateUniqueId(),
          projectId,
          progress: 0,
          deliveryNotes: [],
          ...orderData
        };
        
        set((state) => ({
          projects: state.projects.map((project) => 
            project.id === projectId
              ? { ...project, orders: [...project.orders, newOrder] }
              : project
          )
        }));
      },
      
      updateOrder: (orderId, orderData) => {
        set((state) => {
          const updatedProjects = state.projects.map((project) => {
            const updatedOrders = project.orders.map((order) => 
              order.id === orderId
                ? { ...order, ...orderData, progress: calculateOrderProgress({...order, ...orderData}) }
                : order
            );
            
            return {
              ...project,
              orders: updatedOrders,
              progress: calculateProjectProgress({...project, orders: updatedOrders})
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      deleteOrder: (orderId) => {
        set((state) => {
          const updatedProjects = state.projects.map((project) => {
            const updatedOrders = project.orders.filter((order) => order.id !== orderId);
            
            return {
              ...project,
              orders: updatedOrders,
              progress: calculateProjectProgress({...project, orders: updatedOrders})
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      addDeliveryNote: (orderId, noteData) => {
        const newNote: DeliveryNote = {
          id: generateUniqueId(),
          orderId,
          progress: 0,
          deliveredEquipment: 0,
          verifiedEquipment: 0,
          equipments: [],
          ...noteData
        };
        
        set((state) => {
          const updatedProjects = state.projects.map((project) => {
            const updatedOrders = project.orders.map((order) => {
              if (order.id === orderId) {
                const updatedDeliveryNotes = [...order.deliveryNotes, newNote];
                return {
                  ...order,
                  deliveryNotes: updatedDeliveryNotes,
                  progress: calculateOrderProgress({...order, deliveryNotes: updatedDeliveryNotes})
                };
              }
              return order;
            });
            
            return {
              ...project,
              orders: updatedOrders,
              progress: calculateProjectProgress({...project, orders: updatedOrders})
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      updateDeliveryNote: (noteId, noteData) => {
        set((state) => {
          const updatedProjects = state.projects.map((project) => {
            const updatedOrders = project.orders.map((order) => {
              const updatedDeliveryNotes = order.deliveryNotes.map((note) => {
                if (note.id === noteId) {
                  const updatedNote = { ...note, ...noteData };
                  return {
                    ...updatedNote,
                    progress: calculateDeliveryNoteProgress(updatedNote)
                  };
                }
                return note;
              });
              
              return {
                ...order,
                deliveryNotes: updatedDeliveryNotes,
                progress: calculateOrderProgress({...order, deliveryNotes: updatedDeliveryNotes})
              };
            });
            
            return {
              ...project,
              orders: updatedOrders,
              progress: calculateProjectProgress({...project, orders: updatedOrders})
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      deleteDeliveryNote: (noteId) => {
        set((state) => {
          const updatedProjects = state.projects.map((project) => {
            const updatedOrders = project.orders.map((order) => {
              const updatedDeliveryNotes = order.deliveryNotes.filter((note) => note.id !== noteId);
              
              return {
                ...order,
                deliveryNotes: updatedDeliveryNotes,
                progress: calculateOrderProgress({...order, deliveryNotes: updatedDeliveryNotes})
              };
            });
            
            return {
              ...project,
              orders: updatedOrders,
              progress: calculateProjectProgress({...project, orders: updatedOrders})
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      addEquipment: (deliveryNoteId, equipmentData) => {
        const newEquipment: Equipment = {
          id: generateUniqueId(),
          deliveryNoteId,
          isVerified: false,
          isMatched: false,
          matchedWithId: null,
          estimatedEquipmentId: null,
          photoPath: null,
          ...equipmentData
        };
        
        set((state) => {
          const updatedProjects = state.projects.map((project) => {
            const updatedOrders = project.orders.map((order) => {
              const updatedDeliveryNotes = order.deliveryNotes.map((note) => {
                if (note.id === deliveryNoteId) {
                  const updatedEquipments = [...note.equipments, newEquipment];
                  
                  return {
                    ...note,
                    equipments: updatedEquipments,
                    deliveredEquipment: updatedEquipments.length
                  };
                }
                return note;
              });
              
              return {
                ...order,
                deliveryNotes: updatedDeliveryNotes,
                progress: calculateOrderProgress({...order, deliveryNotes: updatedDeliveryNotes})
              };
            });
            
            return {
              ...project,
              orders: updatedOrders,
              progress: calculateProjectProgress({...project, orders: updatedOrders})
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      updateEquipment: (equipmentId, equipmentData) => {
        set((state) => {
          const updatedProjects = state.projects.map((project) => {
            const updatedOrders = project.orders.map((order) => {
              const updatedDeliveryNotes = order.deliveryNotes.map((note) => {
                const updatedEquipments = note.equipments.map((equipment) => 
                  equipment.id === equipmentId ? { ...equipment, ...equipmentData } : equipment
                );
                
                const verifiedCount = updatedEquipments.filter(e => e.isVerified).length;
                
                return {
                  ...note,
                  equipments: updatedEquipments,
                  verifiedEquipment: verifiedCount,
                  progress: Math.round((verifiedCount / note.estimatedEquipment) * 100)
                };
              });
              
              return {
                ...order,
                deliveryNotes: updatedDeliveryNotes,
                progress: calculateOrderProgress({...order, deliveryNotes: updatedDeliveryNotes})
              };
            });
            
            return {
              ...project,
              orders: updatedOrders,
              progress: calculateProjectProgress({...project, orders: updatedOrders})
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      deleteEquipment: (equipmentId) => {
        set((state) => {
          const updatedProjects = state.projects.map((project) => {
            const updatedOrders = project.orders.map((order) => {
              const updatedDeliveryNotes = order.deliveryNotes.map((note) => {
                const updatedEquipments = note.equipments.filter((equipment) => equipment.id !== equipmentId);
                
                const verifiedCount = updatedEquipments.filter(e => e.isVerified).length;
                
                return {
                  ...note,
                  equipments: updatedEquipments,
                  deliveredEquipment: updatedEquipments.length,
                  verifiedEquipment: verifiedCount,
                  progress: note.estimatedEquipment > 0 
                    ? Math.round((verifiedCount / note.estimatedEquipment) * 100) 
                    : 0
                };
              });
              
              return {
                ...order,
                deliveryNotes: updatedDeliveryNotes,
                progress: calculateOrderProgress({...order, deliveryNotes: updatedDeliveryNotes})
              };
            });
            
            return {
              ...project,
              orders: updatedOrders,
              progress: calculateProjectProgress({...project, orders: updatedOrders})
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      addEstimatedEquipment: (projectId, equipmentData) => {
        const newEquipment: EstimatedEquipment = {
          id: generateUniqueId(),
          projectId,
          assignedEquipmentCount: 0,
          ...equipmentData
        };
        
        // This would typically modify a separate collection of estimated equipment
        // For simplicity, we'll add it as a property on the project
        set((state) => ({
          projects: state.projects.map((project) => 
            project.id === projectId
              ? { 
                  ...project, 
                  estimatedEquipment: (project.estimatedEquipment || 0) + equipmentData.quantity,
                  estimatedEquipmentList: [...(project.estimatedEquipmentList || []), newEquipment]
                }
              : project
          )
        }));
      },
      
      matchEquipment: (equipmentId, estimatedEquipmentId) => {
        set((state) => {
          // Find relevant items to update
          let deliveryNoteId: string | null = null;
          let projectId: string | null = null;
          
          // Find equipment and its delivery note
          state.projects.forEach(project => {
            project.orders.forEach(order => {
              order.deliveryNotes.forEach(note => {
                note.equipments.forEach(equipment => {
                  if (equipment.id === equipmentId) {
                    deliveryNoteId = note.id;
                    projectId = project.id;
                  }
                });
              });
            });
          });
          
          if (!deliveryNoteId || !projectId) return state;
          
          // Update equipment and estimated equipment
          const updatedProjects = state.projects.map((project) => {
            // Update estimated equipment count if this is the project
            const updatedEstimatedEquipmentList = project.id === projectId
              ? (project.estimatedEquipmentList || []).map(estEquip => 
                  estEquip.id === estimatedEquipmentId
                    ? { ...estEquip, assignedEquipmentCount: estEquip.assignedEquipmentCount + 1 }
                    : estEquip
                )
              : (project.estimatedEquipmentList || []);
            
            // Update equipment in delivery notes
            const updatedOrders = project.orders.map((order) => {
              const updatedDeliveryNotes = order.deliveryNotes.map((note) => {
                if (note.id === deliveryNoteId) {
                  const updatedEquipments = note.equipments.map((equipment) => 
                    equipment.id === equipmentId
                      ? { 
                          ...equipment, 
                          isMatched: true, 
                          matchedWithId: estimatedEquipmentId,
                          estimatedEquipmentId
                        }
                      : equipment
                  );
                  
                  return {
                    ...note,
                    equipments: updatedEquipments
                  };
                }
                return note;
              });
              
              return {
                ...order,
                deliveryNotes: updatedDeliveryNotes
              };
            });
            
            return {
              ...project,
              orders: updatedOrders,
              estimatedEquipmentList: updatedEstimatedEquipmentList
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      unmatchEquipment: (equipmentId) => {
        set((state) => {
          // Find relevant items to update
          let deliveryNoteId: string | null = null;
          let projectId: string | null = null;
          let estimatedEquipmentId: string | null = null;
          
          // Find equipment and its delivery note
          state.projects.forEach(project => {
            project.orders.forEach(order => {
              order.deliveryNotes.forEach(note => {
                note.equipments.forEach(equipment => {
                  if (equipment.id === equipmentId) {
                    deliveryNoteId = note.id;
                    projectId = project.id;
                    estimatedEquipmentId = equipment.estimatedEquipmentId;
                  }
                });
              });
            });
          });
          
          if (!deliveryNoteId || !projectId || !estimatedEquipmentId) return state;
          
          // Update equipment and estimated equipment
          const updatedProjects = state.projects.map((project) => {
            // Update estimated equipment count if this is the project
            const updatedEstimatedEquipmentList = project.id === projectId
              ? (project.estimatedEquipmentList || []).map(estEquip => 
                  estEquip.id === estimatedEquipmentId
                    ? { ...estEquip, assignedEquipmentCount: Math.max(0, estEquip.assignedEquipmentCount - 1) }
                    : estEquip
                )
              : (project.estimatedEquipmentList || []);
            
            // Update equipment in delivery notes
            const updatedOrders = project.orders.map((order) => {
              const updatedDeliveryNotes = order.deliveryNotes.map((note) => {
                if (note.id === deliveryNoteId) {
                  const updatedEquipments = note.equipments.map((equipment) => 
                    equipment.id === equipmentId
                      ? { 
                          ...equipment, 
                          isMatched: false, 
                          matchedWithId: null,
                          estimatedEquipmentId: null
                        }
                      : equipment
                  );
                  
                  return {
                    ...note,
                    equipments: updatedEquipments
                  };
                }
                return note;
              });
              
              return {
                ...order,
                deliveryNotes: updatedDeliveryNotes
              };
            });
            
            return {
              ...project,
              orders: updatedOrders,
              estimatedEquipmentList: updatedEstimatedEquipmentList
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      verifyEquipment: (equipmentId, photoPath) => {
        set((state) => {
          const updatedProjects = state.projects.map((project) => {
            const updatedOrders = project.orders.map((order) => {
              const updatedDeliveryNotes = order.deliveryNotes.map((note) => {
                const updatedEquipments = note.equipments.map((equipment) => {
                  if (equipment.id === equipmentId) {
                    return {
                      ...equipment,
                      isVerified: true,
                      photoPath
                    };
                  }
                  return equipment;
                });
                
                const verifiedCount = updatedEquipments.filter(e => e.isVerified).length;
                
                return {
                  ...note,
                  equipments: updatedEquipments,
                  verifiedEquipment: verifiedCount,
                  progress: note.estimatedEquipment > 0 
                    ? Math.round((verifiedCount / note.estimatedEquipment) * 100) 
                    : 0
                };
              });
              
              return {
                ...order,
                deliveryNotes: updatedDeliveryNotes,
                progress: calculateOrderProgress({...order, deliveryNotes: updatedDeliveryNotes})
              };
            });
            
            return {
              ...project,
              orders: updatedOrders,
              progress: calculateProjectProgress({...project, orders: updatedOrders})
            };
          });
          
          return { projects: updatedProjects };
        });
      },
      
      addIncident: (incidentData) => {
        const newIncident: Incident = {
          id: generateUniqueId(),
          createdAt: new Date().toISOString(),
          comments: [],
          ...incidentData
        };
        
        // Add the incident to our incidents array
        set((state) => ({
          incidents: [...state.incidents, newIncident]
        }));
      },
      
      updateIncident: (incidentId, incidentData) => {
        set((state) => ({
          incidents: state.incidents.map(incident => 
            incident.id === incidentId
              ? { ...incident, ...incidentData }
              : incident
          )
        }));
      },
      
      addIncidentComment: (incidentId, commentData) => {
        const newComment: IncidentComment = {
          id: generateUniqueId(),
          date: new Date().toISOString(),
          ...commentData
        };
        
        set((state) => {
          // Find the incident
          const incident = state.incidents.find(inc => inc.id === incidentId);
          
          // If this is the first comment, change status to "En Revisión"
          const statusUpdate = 
            incident && 
            (!incident.comments || incident.comments.length === 0) && 
            incident.status === 'Pendiente'
              ? 'En Revisión'
              : undefined;
          
          return {
            incidents: state.incidents.map(incident => 
              incident.id === incidentId
                ? { 
                    ...incident, 
                    comments: [...(incident.comments || []), newComment],
                    status: statusUpdate || incident.status
                  }
                : incident
            )
          };
        });
      },
      
      generateDeviceName: (datacenter) => {
        // Find appropriate device name record based on equipment type and datacenter
        const deviceNameRecord = get().deviceNameDB.find(record => 
          record.datacenter === datacenter && record.prefix === 'SRV' // Default to server
        );
        
        if (!deviceNameRecord) {
          return 'SRV-UNK-0001'; // Fallback name
        }
        
        // Increment last number and update record
        const newDeviceName = getNextDeviceName(
          deviceNameRecord.prefix,
          deviceNameRecord.datacenter,
          deviceNameRecord.lastNumber
        );
        
        // Update the device name DB
        set((state) => ({
          deviceNameDB: state.deviceNameDB.map(record =>
            record.id === deviceNameRecord.id
              ? { ...record, lastNumber: record.lastNumber + 1 }
              : record
          )
        }));
        
        return newDeviceName;
      },
      
      getProjectById: (projectId) => {
        return get().projects.find(project => project.id === projectId);
      },
      
      getOrderById: (orderId) => {
        let foundOrder: Order | undefined;
        
        get().projects.forEach(project => {
          const order = project.orders.find(o => o.id === orderId);
          if (order) foundOrder = order;
        });
        
        return foundOrder;
      },
      
      getDeliveryNoteById: (noteId) => {
        let foundNote: DeliveryNote | undefined;
        
        get().projects.forEach(project => {
          project.orders.forEach(order => {
            const note = order.deliveryNotes.find(n => n.id === noteId);
            if (note) foundNote = note;
          });
        });
        
        return foundNote;
      },
      
      getEstimatedEquipmentByProjectId: (projectId) => {
        const project = get().projects.find(p => p.id === projectId);
        return project?.estimatedEquipmentList || [];
      }
    }),
    {
      name: 'datacenter-app-storage'
    }
  )
);