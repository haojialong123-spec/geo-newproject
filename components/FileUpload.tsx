import React, { useRef, useState } from 'react';
import { Upload, FileAudio, FileText, Loader2, Clipboard, Mic } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    const blob = new Blob([pastedText], { type: 'text/plain' });
    const file = new File([blob], "文本粘贴稿.txt", { type: 'text/plain' });
    onUpload(file);
    setPastedText('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 p-8 mb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h3 className="text-xl font-serif text-slate-900">案情采集</h3>
            <p className="text-sm text-slate-500 mt-1">支持上传咨询录音整理稿或直接粘贴案情文本</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
           <TabButton 
                isActive={activeTab === 'upload'} 
                onClick={() => setActiveTab('upload')} 
                label="文件上传"
            />
           <TabButton 
                isActive={activeTab === 'paste'} 
                onClick={() => setActiveTab('paste')} 
                label="文本粘贴"
            />
        </div>
      </div>
      
      {activeTab === 'upload' ? (
        <div 
          className={`relative border border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-all duration-300 group ${
            dragActive 
                ? "border-amber-500 bg-amber-50/50" 
                : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400"
          } ${isProcessing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={!isProcessing ? handleDrop : undefined}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={handleChange}
            accept=".mp3,.wav,.m4a,.docx,.pdf,.txt"
            disabled={isProcessing}
          />
          
          {isProcessing ? (
            <div className="flex flex-col items-center animate-pulse">
              <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-4" />
              <p className="text-base font-medium text-slate-800">AI 深度法律语义识别中...</p>
              <p className="text-xs text-slate-500 mt-2 font-mono">提取: 案件要素 / 证据等级 / 痛点画像</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                <Upload className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-base font-medium text-slate-700 mb-2">点击上传或拖拽文件至此处</p>
              <p className="text-xs text-slate-400 max-w-sm text-center">
                支持 Word (.docx), 纯文本 (.txt)
              </p>
              <div className="flex gap-6 mt-8">
                 <FeatureTag icon={<Mic size={12}/>} label="录音转写稿" />
                 <FeatureTag icon={<FileText size={12}/>} label="案情笔录" />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="relative h-64">
           <textarea
             className="w-full h-full p-6 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none text-sm text-slate-700 bg-slate-50/50 placeholder-slate-400 font-normal leading-relaxed transition-shadow shadow-inner"
             placeholder="请在此处直接粘贴录音转写稿、案情描述或复制 PDF 中的文字内容..."
             value={pastedText}
             onChange={(e) => setPastedText(e.target.value)}
             disabled={isProcessing}
           />
           <div className="absolute bottom-4 right-4">
               <button
                onClick={handlePasteSubmit}
                disabled={isProcessing || !pastedText.trim()}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                {isProcessing ? <Loader2 size={16} className="animate-spin mr-2"/> : <Clipboard size={16} className="mr-2"/>}
                开始分析
                </button>
           </div>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ isActive, onClick, label }: any) => (
    <button 
        onClick={onClick}
        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
        isActive 
            ? 'bg-white shadow-sm text-slate-900 border border-slate-100' 
            : 'text-slate-500 hover:text-slate-700'
        }`}
    >
        {label}
    </button>
);

const FeatureTag = ({ icon, label }: any) => (
    <span className="flex items-center text-[10px] text-slate-400 bg-slate-100/50 px-2 py-1 rounded border border-slate-100">
        <span className="mr-1.5 text-slate-500">{icon}</span> {label}
    </span>
);

export default FileUpload;
