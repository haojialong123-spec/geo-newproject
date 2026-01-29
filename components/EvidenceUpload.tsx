import React from 'react';
import { Upload, File as FileIcon, X, Image } from 'lucide-react';
import { FileWithPreview } from '../types';

interface EvidenceUploadProps {
    files: FileWithPreview[];
    setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>;
    disabled: boolean;
}

const EvidenceUpload: React.FC<EvidenceUploadProps> = ({ files, setFiles, disabled }) => {

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files) as File[];
            processFiles(newFiles);
        }
    };

    const processFiles = (newFiles: File[]) => {
        const processedFiles: FileWithPreview[] = [];

        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const processed = Object.assign(file, {
                    preview: URL.createObjectURL(file),
                    base64: e.target?.result as string,
                    mimeType: file.type,
                }) as FileWithPreview;

                processedFiles.push(processed);

                if (processedFiles.length === newFiles.length) {
                    setFiles(prev => [...prev, ...processedFiles]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (name: string) => {
        setFiles(prev => prev.filter(f => f.name !== name));
    };

    const getFileIcon = (mimeType?: string) => {
        if (mimeType?.startsWith('image/')) {
            return <Image className="w-5 h-5 text-amber-600" />;
        }
        return <FileIcon className="w-5 h-5 text-slate-600" />;
    };

    return (
        <div className="space-y-4">
            {/* 上传区域 - 使用琥珀色主题 */}
            <div className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-all
        ${disabled
                    ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                    : 'bg-amber-50/30 border-amber-300 hover:border-amber-500 hover:bg-amber-50/50 cursor-pointer'}
      `}>
                <input
                    type="file"
                    id="evidence-upload"
                    multiple
                    accept=".pdf,image/*,.doc,.docx"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={disabled}
                />
                <label htmlFor="evidence-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">点击上传案卷材料</h3>
                    <p className="text-sm text-slate-500 mt-2">支持 PDF、JPG、PNG、Word 格式 (合同、支付凭证、补充协议)</p>
                </label>
            </div>

            {/* 已上传文件列表 */}
            {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {files.map((file, idx) => (
                        <div
                            key={`${file.name}-${idx}`}
                            className="flex items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                                {getFileIcon(file.mimeType)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            {!disabled && (
                                <button
                                    onClick={() => removeFile(file.name)}
                                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EvidenceUpload;
