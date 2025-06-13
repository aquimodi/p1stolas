import * as XLSX from 'xlsx';
import { EstimatedEquipment } from '../types';
import { parseExcelWithJS, parseExcelWithAI } from './excelService';
import { useSettingsStore } from '../store/settingsStore';
import { apiService } from './apiService';

export const readExcelFile = async (file: File): Promise<{ equipmentList: EstimatedEquipment[], projectData: any }> => {
  // Get current parser method from settings
  const { settings } = useSettingsStore.getState();
  
  // Use the appropriate parser based on settings
  if (settings.excelParserMethod === 'javascript') {
    return parseExcelWithJS(file);
  } else {
    return parseExcelWithAI(file);
  }
};

export const exportExcelFile = async (projectData: any, equipmentList: any[]): Promise<void> => {
  const { settings } = useSettingsStore.getState();
  
  try {
    if (settings.demoMode) {
      // If in demo mode, use client-side Excel export
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add project info sheet
      const projectWs = XLSX.utils.json_to_sheet([projectData]);
      XLSX.utils.book_append_sheet(wb, projectWs, 'Project Info');
      
      // Add equipment list sheet
      const equipmentWs = XLSX.utils.json_to_sheet(equipmentList);
      XLSX.utils.book_append_sheet(wb, equipmentWs, 'Equipment List');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(wb, `${projectData.projectCode || 'project'}.xlsx`);
    } else {
      // If not in demo mode, use API
      const result = await apiService.exportToExcel(projectData, equipmentList);
      
      // If API returned a file URL, trigger download
      if (result.url) {
        window.open(result.url, '_blank');
      }
    }
  } catch (error) {
    console.error('Error exporting Excel file:', error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const createImageFromCamera = (stream: MediaStream): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    // Wait for video to be ready
    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        resolve(dataUrl);
      }
      
      // Stop the video stream
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    };
  });
};