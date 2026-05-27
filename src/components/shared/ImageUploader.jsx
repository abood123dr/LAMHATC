const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef } from "react";

import { X, Loader2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImageUploader({ value = [], onChange, max = 10 }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const list = Array.from(files).slice(0, max - value.length);
    if (!list.length) return;
    setUploading(true);
    const urls = [];
    for (const file of list) {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    onChange([...value, ...urls]);
    setUploading(false);
  };

  const removeImage = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          dragging
            ? "border-gold bg-accent"
            : "border-border hover:border-gold/60 hover:bg-accent/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <p className="text-sm text-muted-foreground">جاري رفع الصور...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <ImagePlus className="w-6 h-6 text-gold" />
              </div>
              <p className="text-sm font-medium text-foreground">
                اسحب الصور هنا أو اضغط للاختيار
              </p>
              <p className="text-xs text-muted-foreground">
                يمكنك رفع حتى {max} صور
              </p>
            </>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {value.map((url, idx) => (
            <div
              key={idx}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border shadow-sm"
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}