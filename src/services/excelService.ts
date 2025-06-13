import * as XLSX from 'xlsx';
import { EstimatedEquipment } from '../types';
import { analyzePdfWithMistral } from './mistralService';
import { getMistralAIPrompt } from '../utils/helpers';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Parse Excel file using JavaScript (XLSX library)
 */
export const parseExcelWithJS = async (file: File): Promise<{ equipmentList: EstimatedEquipment[], projectData: any }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume the first sheet contains project info
        const projectInfoSheet = workbook.Sheets[workbook.SheetNames[0]];
        const projectData = XLSX.utils.sheet_to_json(projectInfoSheet);
        
        // Assume the second sheet contains equipment list
        let equipmentList: EstimatedEquipment[] = [];
        if (workbook.SheetNames.length > 1) {
          const equipmentSheet = workbook.Sheets[workbook.SheetNames[1]];
          const rawEquipmentList = XLSX.utils.sheet_to_json(equipmentSheet);
          
          equipmentList = rawEquipmentList.map((item: any) => ({
            id: '',  // Will be assigned when added to store
            projectId: '',  // Will be assigned when added to store
            type: item.Type || '',
            model: item.Model || '',
            quantity: parseInt(item.Quantity || '0', 10),
            assignedEquipmentCount: 0
          }));
        }
        
        resolve({ equipmentList, projectData: projectData[0] || {} });
      } catch (error) {
        console.error("Error parsing Excel with JS:", error);
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse Excel file using AI
 */
export const parseExcelWithAI = async (file: File): Promise<{ equipmentList: EstimatedEquipment[], projectData: any }> => {
  try {
    // Convert the Excel file to base64
    const reader = new FileReader();
    const fileBase64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    // Use AI to analyze the Excel file
    const prompt = getMistralAIPrompt();
    const equipments = await analyzePdfWithMistral(fileBase64, prompt);
    
    // For now, just return some mock project data as AI may not structure it correctly
    const projectData = {
      RITM: 'RITM' + Math.floor(10000 + Math.random() * 90000),
      ProjectName: 'Proyecto Analizado por IA',
      Client: 'Cliente',
      Datacenter: 'MAD',
      DeliveryDate: new Date().toISOString().split('T')[0],
      TeamsUrl: 'https://teams.microsoft.com/'
    };
    
    // Convert the AI output to the expected format
    const equipmentList: EstimatedEquipment[] = equipments.reduce((acc: EstimatedEquipment[], equipment) => {
      // Check if we already have this type and model
      const existingEquipment = acc.find(
        e => e.type.toLowerCase() === equipment.type.toLowerCase() && 
             e.model.toLowerCase() === equipment.model.toLowerCase()
      );
      
      if (existingEquipment) {
        // Increment the quantity
        existingEquipment.quantity += 1;
      } else {
        // Add new equipment type
        acc.push({
          id: '',  // Will be assigned when added to store
          projectId: '',  // Will be assigned when added to store
          type: equipment.type || 'Desconocido',
          model: equipment.model || 'Desconocido',
          quantity: 1,
          assignedEquipmentCount: 0
        });
      }
      
      return acc;
    }, []);
    
    return { equipmentList, projectData };
  } catch (error) {
    console.error("Error parsing Excel with AI:", error);
    // Fallback to JS parsing if AI fails
    return parseExcelWithJS(file);
  }
};