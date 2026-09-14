const API_BASE = "/api";

async function handle(res) {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json();
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  listDatasets: () => fetch(`${API_BASE}/datasets/`).then(handle),

  getDataset: (id) => fetch(`${API_BASE}/datasets/${id}/`).then(handle),

  createManual: (payload) =>
    fetch(`${API_BASE}/datasets/manual/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  generateRandom: (days = 14) =>
    fetch(`${API_BASE}/datasets/random/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    }).then(handle),

  upload: (file) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/datasets/upload/`, {
      method: "POST",
      body: form,
    }).then(handle);
  },

  downloadSampleCsv: () =>
    fetch(`${API_BASE}/datasets/sample/csv/`)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.blob();
      })
      .then((blob) => triggerDownload(blob, "sample_dataset.csv")),

  downloadSampleXlsx: () =>
    fetch(`${API_BASE}/datasets/sample/xlsx/`)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.blob();
      })
      .then((blob) => triggerDownload(blob, "sample_dataset.xlsx")),
};