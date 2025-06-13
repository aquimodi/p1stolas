import { useSettingsStore } from '../store/settingsStore';
import { analyzeDocumentWithAI, automaticMatchEquipments } from './aiService';

export const analyzePdfWithMistral = async (
  fileBase64: string,
  prompt: string
) => {
  return analyzeDocumentWithAI(fileBase64, 'application/pdf', prompt);
};

export const analyzeExcelWithMistral = async (
  fileBase64: string,
  prompt: string
) => {
  return analyzeDocumentWithAI(fileBase64, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', prompt);
};

export const analyzeImageWithMistral = async (
  fileBase64: string,
  prompt: string
) => {
  return analyzeDocumentWithAI(fileBase64, 'image/jpeg', prompt);
};

export { automaticMatchEquipments };