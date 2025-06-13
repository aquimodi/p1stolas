import * as Tesseract from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';
import { Equipment } from '../types';

// Initialize pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Analyzes equipment data from PDF documents using Scribe.js (Tesseract OCR)
 */
export const analyzeDocumentWithScribe = async (fileBase64: string, fileType: string): Promise<Equipment[]> => {
  try {
    if (fileType.includes('pdf')) {
      return await analyzePdf(fileBase64);
    } else if (fileType.includes('image')) {
      return await analyzeImage(fileBase64);
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      // For excel files, we would typically use a different approach
      // For simplicity, we'll return an empty array
      console.warn('Excel analysis not implemented in Scribe OCR');
      return [];
    } else {
      console.warn('Unsupported file type for Scribe OCR');
      return [];
    }
  } catch (error) {
    console.error('Error analyzing document with Scribe OCR:', error);
    throw new Error('Error analyzing document with Scribe OCR');
  }
};

/**
 * Analyzes PDF documents using pdf.js to extract text and Tesseract for OCR
 */
const analyzePdf = async (fileBase64: string): Promise<Equipment[]> => {
  // Convert base64 to ArrayBuffer
  const binary = atob(fileBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  try {
    // Load PDF document
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    
    let combinedText = '';
    
    // Process each page
    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) { // Process up to 5 pages
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      combinedText += pageText + ' ';
    }
    
    // Extract equipment data from the text
    return extractEquipmentFromText(combinedText);
  } catch (error) {
    console.error('Error analyzing PDF with Scribe OCR:', error);
    throw error;
  }
};

/**
 * Analyzes images using Tesseract OCR
 */
const analyzeImage = async (fileBase64: string): Promise<Equipment[]> => {
  try {
    const { data } = await Tesseract.recognize(
      `data:image/jpeg;base64,${fileBase64}`,
      'spa', // Spanish language
      {
        logger: (m) => console.log(m) // Optional logger for debugging
      }
    );
    
    // Extract equipment data from the text
    return extractEquipmentFromText(data.text);
  } catch (error) {
    console.error('Error analyzing image with Tesseract OCR:', error);
    throw error;
  }
};

/**
 * Extracts equipment data from text using regex and pattern matching
 */
const extractEquipmentFromText = (text: string): Equipment[] => {
  const equipments: Equipment[] = [];
  
  // Remove line breaks and extra spaces
  const cleanText = text.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Common equipment types for regex patterns
  const equipmentTypes = ['servidor', 'switch', 'router', 'storage', 'firewall'];
  
  // Match patterns for equipment based on common keywords
  equipmentTypes.forEach(type => {
    // Case insensitive regex to find equipment information
    const regex = new RegExp(`(([\\w\\s-]+)(${type})[\\w\\s-]+)`, 'gi');
    const matches = cleanText.matchAll(regex);
    
    for (const match of matches) {
      if (match[0]) {
        // Extract equipment name
        const name = match[0].trim();
        
        // Now look for potential serial numbers near this equipment mention
        // Serial numbers often follow patterns like "S/N", "Serial", "SN:", etc.
        const snRegex = new RegExp(`(?:S\\/N|Serial|SN:?)\\s*([A-Z0-9]{5,})`, 'gi');
        const serialMatches = cleanText.matchAll(snRegex);
        let serialNumber = '';
        
        for (const serialMatch of serialMatches) {
          if (serialMatch[1]) {
            serialNumber = serialMatch[1].trim();
            break;
          }
        }
        
        // Similarly for part numbers
        const pnRegex = new RegExp(`(?:P\\/N|Part|PN:?)\\s*([A-Z0-9]{5,})`, 'gi');
        const partMatches = cleanText.matchAll(pnRegex);
        let partNumber = '';
        
        for (const partMatch of partMatches) {
          if (partMatch[1]) {
            partNumber = partMatch[1].trim();
            break;
          }
        }
        
        // Extract model (simplistic approach)
        const modelRegex = new RegExp(`(${type}\\s+[A-Za-z0-9-]+)`, 'gi');
        const modelMatches = name.matchAll(modelRegex);
        let model = '';
        
        for (const modelMatch of modelMatches) {
          if (modelMatch[1]) {
            model = modelMatch[1].trim();
            break;
          }
        }
        
        // Add equipment to the list
        equipments.push({
          id: '',  // Will be assigned when added to store
          deliveryNoteId: null,
          name,
          serialNumber,
          partNumber,
          deviceName: '',  // Will be generated later
          type,
          model: model || type,
          isVerified: false,
          photoPath: null,
          isMatched: false,
          matchedWithId: null,
          estimatedEquipmentId: null
        });
      }
    }
  });
  
  return equipments;
};