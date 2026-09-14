import { useRef, useState } from "react";

export default function UploadPanel({ onUpload, loading }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    onUpload(file);
  };

  return (
    <div
      className={`upload-zone ${dragging ? "dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="upload-icon">↑</div>
      <div className="upload-title">{loading ? "Загружаем…" : "Перетащите CSV или Excel сюда"}</div>
      <div className="upload-hint">или нажмите, чтобы выбрать файл · .csv, .xlsx, .xls</div>
      {fileName && <div className="upload-filename">{fileName}</div>}

      <div className="upload-format" onClick={(e) => e.stopPropagation()}>
        <div className="upload-format-title">Ожидаемый формат (широкая таблица)</div>
        <pre>{`date,Cost,CPA,ROI confirmed,Conversions
2026-06-01,20.5,1.1,90,12
2026-06-02,25.1,1.3,110,18`}</pre>
        <p>Первая колонка — дата, следующие 1–4 колонки — значения серий (в порядке area → spline → line → bar).</p>
      </div>
    </div>
  );
}
