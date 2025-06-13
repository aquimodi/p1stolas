import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define settings file path
const settingsFile = path.join(__dirname, '../../settings.json');

// Default settings
const defaultSettings = {
  demoMode: true,
  debugMode: false
};

// Create settings file if it doesn't exist
if (!fs.existsSync(settingsFile)) {
  fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2));
}

// Function to get settings
export const getSettings = () => {
  try {
    // Read settings from file
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    return { ...defaultSettings, ...settings };
  } catch (error) {
    console.error('Error reading settings file:', error);
    return defaultSettings;
  }
};

// Function to update settings
export const updateSettings = (newSettings) => {
  try {
    // Read current settings
    const currentSettings = getSettings();
    
    // Merge with new settings
    const settings = { ...currentSettings, ...newSettings };
    
    // Write to file
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    
    return settings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};