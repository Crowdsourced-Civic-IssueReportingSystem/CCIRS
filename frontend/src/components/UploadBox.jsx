import { ImagePlus, UploadCloud } from "lucide-react";
import { useRef } from "react";

function UploadBox({ preview, onFileChange, error }) {
  const inputRef = useRef(null);

  const onDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) onFileChange(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Issue image</label>
      <div
        className={`panel flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 border-dashed p-4 text-center transition hover:border-primary ${error ? "border-red-300" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
      >
        {preview ? (
          <img src={preview} alt="Issue preview" className="h-40 w-full rounded-soft object-cover" />
        ) : (
          <>
            <UploadCloud className="h-7 w-7 text-primary" />
            <p className="text-sm font-medium text-slate-700">Drag & drop or click to upload</p>
            <p className="text-xs text-slate-500">PNG/JPG up to 10MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileChange(file);
        }}
      />
      {!preview && (
        <p className="inline-flex items-center gap-1 text-xs text-slate-500">
          <ImagePlus className="h-3.5 w-3.5" /> Add clear photo evidence for faster resolution.
        </p>
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export default UploadBox;
