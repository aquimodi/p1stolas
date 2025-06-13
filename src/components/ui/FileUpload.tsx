import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File } from 'lucide-react';
import Button from './Button';

interface FileUploadProps {
  onFileChange: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  label?: string;
  multiple?: boolean;
  showPreview?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileChange,
  accept,
  maxSize = 5242880, // 5MB
  label = 'Subir archivo',
  multiple = false,
  showPreview = true,
  className
}) => {
  const [files, setFiles] = React.useState<File[]>([]);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    if (acceptedFiles.length > 0) {
      if (multiple) {
        acceptedFiles.forEach(file => onFileChange(file));
      } else {
        onFileChange(acceptedFiles[0]);
      }
    }
  }, [multiple, onFileChange]);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple
  });
  
  const removeFile = (file: File) => {
    const newFiles = files.filter(f => f !== file);
    setFiles(newFiles);
  };
  
  return (
    <div className={className}>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-red-400'}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="text-gray-600">{label}</p>
          <p className="text-sm text-gray-500">
            {isDragActive ? 'Suelta para subir' : 'Arrastra archivos aquí, o haz clic para seleccionarlos'}
          </p>
        </div>
      </div>
      
      {showPreview && files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Archivos seleccionados:</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  <File className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => removeFile(file)}
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;