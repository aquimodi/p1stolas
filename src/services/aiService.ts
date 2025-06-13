import axios from 'axios';
import { useSettingsStore } from '../store/settingsStore';
import { AIProvider, Equipment } from '../types';

/**
 * Generic function to analyze documents using AI services
 */
export const analyzeDocumentWithAI = async (
  fileBase64: string,
  fileType: string,
  prompt: string
): Promise<Equipment[]> => {
  try {
    const { settings } = useSettingsStore.getState();
    const aiProvider = settings.aiProvider;
    
    if (settings.demoMode) {
      // In demo mode, just return mock data
      return mockEquipment();
    }
    
    switch (aiProvider.name) {
      case 'OpenAI':
        return await analyzeWithOpenAI(fileBase64, fileType, prompt, aiProvider);
      case 'AzureOpenAI':
        return await analyzeWithAzureOpenAI(fileBase64, fileType, prompt, aiProvider);
      case 'MistralAI':
      default:
        return await analyzeWithMistralAI(fileBase64, fileType, prompt, aiProvider);
    }
  } catch (error) {
    console.error('Error analyzing document with AI:', error);
    throw new Error(`Error analyzing document with ${useSettingsStore.getState().settings.aiProvider.name}`);
  }
};

/**
 * Function to analyze document with OpenAI
 */
const analyzeWithOpenAI = async (
  fileBase64: string,
  fileType: string,
  prompt: string,
  aiProvider: AIProvider
): Promise<Equipment[]> => {
  try {
    // Determine content type for proper encoding
    const contentType = fileType.includes('pdf') 
      ? 'application/pdf' 
      : fileType.includes('image') 
        ? 'image/jpeg' 
        : 'application/octet-stream';
    
    // Call OpenAI API (assuming using their vision model)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: aiProvider.model,
        messages: [
          { role: 'system', content: prompt },
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: 'Analiza el siguiente documento y extrae la información de los equipos' 
              },
              { 
                type: 'image_url', 
                image_url: {
                  url: `data:${contentType};base64,${fileBase64}`
                } 
              }
            ] 
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiProvider.apiKey}`
        }
      }
    );
    
    // Parse the response
    const aiResponse = response.data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/```json([\s\S]*?)```/) || 
                      aiResponse.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] ? jsonMatch[1].trim() : jsonMatch[0].trim();
      const result = JSON.parse(jsonStr);
      
      if (Array.isArray(result.equipments)) {
        return result.equipments.map((item) => ({
          id: '',  // Will be assigned when added to store
          deliveryNoteId: null,
          name: item.name || '',
          serialNumber: item.serialNumber || '',
          partNumber: item.partNumber || '',
          deviceName: '',  // Will be generated later
          type: item.type || '',
          model: item.model || '',
          isVerified: false,
          photoPath: null,
          isMatched: false,
          matchedWithId: null,
          estimatedEquipmentId: null
        }));
      }
    }
    
    throw new Error('No se pudo extraer información estructurada del documento');
  } catch (error) {
    console.error('Error analyzing with OpenAI:', error);
    throw error;
  }
};

/**
 * Function to analyze document with Azure OpenAI
 */
const analyzeWithAzureOpenAI = async (
  fileBase64: string,
  fileType: string,
  prompt: string,
  aiProvider: AIProvider
): Promise<Equipment[]> => {
  try {
    // Check if we have the necessary Azure configuration
    if (!aiProvider.endpoint || !aiProvider.version) {
      throw new Error('Faltan la configuración endpoint o version para Azure OpenAI');
    }
    
    // Determine content type for proper encoding
    const contentType = fileType.includes('pdf') 
      ? 'application/pdf' 
      : fileType.includes('image') 
        ? 'image/jpeg' 
        : 'application/octet-stream';
    
    // Call Azure OpenAI API
    const response = await axios.post(
      `${aiProvider.endpoint}/openai/deployments/${aiProvider.model}/chat/completions?api-version=${aiProvider.version}`,
      {
        messages: [
          { role: 'system', content: prompt },
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: 'Analiza el siguiente documento y extrae la información de los equipos' 
              },
              { 
                type: 'image_url', 
                image_url: {
                  url: `data:${contentType};base64,${fileBase64}`
                } 
              }
            ] 
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': aiProvider.apiKey
        }
      }
    );
    
    // Parse the response
    const aiResponse = response.data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/```json([\s\S]*?)```/) || 
                      aiResponse.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] ? jsonMatch[1].trim() : jsonMatch[0].trim();
      const result = JSON.parse(jsonStr);
      
      if (Array.isArray(result.equipments)) {
        return result.equipments.map((item) => ({
          id: '',  // Will be assigned when added to store
          deliveryNoteId: null,
          name: item.name || '',
          serialNumber: item.serialNumber || '',
          partNumber: item.partNumber || '',
          deviceName: '',  // Will be generated later
          type: item.type || '',
          model: item.model || '',
          isVerified: false,
          photoPath: null,
          isMatched: false,
          matchedWithId: null,
          estimatedEquipmentId: null
        }));
      }
    }
    
    throw new Error('No se pudo extraer información estructurada del documento');
  } catch (error) {
    console.error('Error analyzing with Azure OpenAI:', error);
    throw error;
  }
};

/**
 * Function to analyze document with Mistral AI
 */
const analyzeWithMistralAI = async (
  fileBase64: string,
  fileType: string,
  prompt: string,
  aiProvider: AIProvider
): Promise<Equipment[]> => {
  try {
    // Determine content type for proper encoding
    const contentType = fileType.includes('pdf') 
      ? 'application/pdf' 
      : fileType.includes('image') 
        ? 'image/jpeg' 
        : 'application/octet-stream';
    
    // Call Mistral API
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: aiProvider.model,
        messages: [
          { role: 'system', content: prompt },
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: 'Analiza el siguiente documento y extrae la información de los equipos' 
              },
              { 
                type: 'image', 
                image_url: {
                  url: `data:${contentType};base64,${fileBase64}`
                } 
              }
            ] 
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiProvider.apiKey}`
        }
      }
    );
    
    // Parse the response
    const aiResponse = response.data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/```json([\s\S]*?)```/) || 
                      aiResponse.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] ? jsonMatch[1].trim() : jsonMatch[0].trim();
      const result = JSON.parse(jsonStr);
      
      if (Array.isArray(result.equipments)) {
        return result.equipments.map((item) => ({
          id: '',  // Will be assigned when added to store
          deliveryNoteId: null,
          name: item.name || '',
          serialNumber: item.serialNumber || '',
          partNumber: item.partNumber || '',
          deviceName: '',  // Will be generated later
          type: item.type || '',
          model: item.model || '',
          isVerified: false,
          photoPath: null,
          isMatched: false,
          matchedWithId: null,
          estimatedEquipmentId: null
        }));
      }
    }
    
    throw new Error('No se pudo extraer información estructurada del documento');
  } catch (error) {
    console.error('Error analyzing with Mistral AI:', error);
    throw error;
  }
};

/**
 * Function to match equipment using AI
 */
export const automaticMatchEquipments = async (
  deliveryEquipments: Equipment[],
  estimatedEquipments: any[],
  prompt: string
): Promise<Record<string, string>> => {
  try {
    const { settings } = useSettingsStore.getState();
    
    if (settings.demoMode) {
      // In demo mode, generate some mock matches
      return mockMatches(deliveryEquipments, estimatedEquipments);
    } else {
      // In a real implementation, we would call the appropriate AI service
      // For now, we'll generate some mock matches
      return mockMatches(deliveryEquipments, estimatedEquipments);
    }
  } catch (error) {
    console.error('Error calling AI for matching:', error);
    return {};
  }
};

/**
 * Helper functions to generate mock data for testing
 */

// Helper function to generate mock equipment data
export const mockEquipment = (): Equipment[] => {
  const types = ['Servidor', 'Switch', 'Router', 'Storage'];
  const models = {
    'Servidor': ['Dell PowerEdge R740', 'HPE ProLiant DL380', 'IBM Power9'],
    'Switch': ['Cisco Nexus 9336C', 'Juniper EX4300', 'Arista 7280R'],
    'Router': ['Cisco 8300', 'Juniper MX204', 'Arista 7500R'],
    'Storage': ['NetApp AFF A400', 'Dell EMC PowerStore', 'HPE Primera']
  };
  
  const count = Math.floor(Math.random() * 5) + 3; // 3-7 items
  const equipments: Equipment[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const typeModels = models[type];
    const model = typeModels[Math.floor(Math.random() * typeModels.length)];
    
    equipments.push({
      id: '',
      deliveryNoteId: null,
      name: `${model} #${i+1}`,
      serialNumber: `SN${Math.floor(10000 + Math.random() * 90000)}`,
      partNumber: `PN${Math.floor(10000 + Math.random() * 90000)}`,
      deviceName: '',
      type,
      model,
      isVerified: false,
      photoPath: null,
      isMatched: false,
      matchedWithId: null,
      estimatedEquipmentId: null
    });
  }
  
  return equipments;
};

// Helper function to generate mock matches
const mockMatches = (
  deliveryEquipments: Equipment[],
  estimatedEquipments: any[]
): Record<string, string> => {
  const matches: Record<string, string> = {};
  
  // Create a map of available estimated equipment
  const availableEstimated = new Map();
  
  estimatedEquipments.forEach(ee => {
    const key = `${ee.type}-${ee.model}`;
    if (!availableEstimated.has(key)) {
      availableEstimated.set(key, []);
    }
    
    if (ee.remaining > 0) {
      availableEstimated.get(key).push({
        id: ee.id,
        remaining: ee.remaining
      });
    }
  });
  
  // Try to match equipment
  deliveryEquipments.forEach(de => {
    if (de.isMatched) return; // Skip already matched equipment
    
    const key = `${de.type}-${de.model}`;
    const matchOptions = availableEstimated.get(key) || [];
    
    if (matchOptions.length > 0) {
      const match = matchOptions[0];
      matches[de.id] = match.id;
      
      // Update remaining count
      match.remaining--;
      
      // Remove from options if no more remaining
      if (match.remaining <= 0) {
        matchOptions.shift();
      }
    }
  });
  
  return matches;
};