'use client';

import React, { useState } from 'react';
import { Loader2, Image as ImageIcon, Plus, Maximize2, X } from 'lucide-react';

interface ImageUploaderProps {
  src?: string;
  onUpload?: (file: File) => Promise<void>;
  onDelete?: () => void;
  onZoom?: (src: string) => void;
  isMain?: boolean;
  className?: string;
  readOnly?: boolean; // 如果为 true，则不显示上传/删除按钮
}

export default function ImageUploader({ 
  src, 
  onUpload, 
  onDelete, 
  onZoom, 
  isMain = false, 
  className = "", 
  readOnly = false 
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !onUpload) return;
    setUploading(true);
    await onUpload(e.target.files[0]);
    setUploading(false);
  };

  if (readOnly && !src) return null;

  return (
    <div className={`relative group ${isMain ? 'w-full h-56' : 'w-24 h-24 flex-shrink-0'} ${className}`}>
      {src ? (
        <>
          <img src={src} className={`w-full h-full object-cover border border-slate-200 ${isMain ? 'rounded-lg' : 'rounded-lg'}`} />
          
          {/* 悬停遮罩层 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
             {/* 放大按钮 (任何人可见) */}
             {onZoom && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onZoom(src); }} 
                 className="bg-white/90 p-1.5 rounded-full hover:text-blue-600 shadow-sm"
                 title="放大查看"
               >
                 <Maximize2 className="w-4 h-4" />
               </button>
             )}
             
             {/* 删除按钮 (仅非只读模式可见) */}
             {!readOnly && onDelete && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                 className="bg-white/90 p-1.5 rounded-full hover:text-red-600 shadow-sm"
                 title="删除图片"
               >
                 <X className="w-4 h-4" />
               </button>
             )}
          </div>
        </>
      ) : (
        !readOnly && (
          <label className={`cursor-pointer border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50 transition-colors flex flex-col items-center justify-center text-slate-400 gap-2 w-full h-full ${isMain ? 'rounded-lg' : 'rounded-lg'}`}>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading}/>
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-purple-500"/>
            ) : (
              isMain ? <ImageIcon className="w-10 h-10"/> : <Plus className="w-6 h-6"/>
            )}
            {!isMain && <span className="text-xs">上传图片</span>}
          </label>
        )
      )}
    </div>
  );
}
