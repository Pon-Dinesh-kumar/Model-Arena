
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ModelFileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

const ModelFileUpload: React.FC<ModelFileUploadProps> = ({ 
  onFileSelect,
  accept = ".json",
  disabled = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={disabled}
      />
      <Button 
        onClick={handleClick}
        variant="outline"
        disabled={disabled}
        className="w-full"
      >
        Upload Model File
      </Button>
    </div>
  );
};

export default ModelFileUpload;
