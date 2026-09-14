import { useEffect, useRef, useState } from "react";
import MultiSeriesChart from "./components/Chart.jsx";
import ManualEntry from "./components/ManualEntry.jsx";
import { api } from "./api.js";

export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const loadList = async () => {
    try {
      const data = await api.listDatasets();
      setDatasets(data.results ?? data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const openDataset = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const full = await api.getDataset(id);
      setActive(full);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManual = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const created = await api.createManual(payload);
      setActive(created);
      loadList();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRandom = async () => {
    setLoading(true);
    setError(null);

    try {
      const created = await api.generateRandom(14);
      setActive(created);
      loadList();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const created = await api.upload(file);
      setActive(created);
      loadList();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startNewDataset = () => {
    setActive(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>

          <div>
            <div className="brand-title">Аналитика</div>
            <div className="brand-subtitle">Создание и анализ графиков</div>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="header-button header-button-secondary"
            onClick={() => api.downloadSampleCsv()}
            disabled={loading}
            title="Скачать образец CSV"
          >
            <span className="button-icon">↓</span>
            Образец CSV
          </button>

          <button
            className="header-button header-button-secondary"
            onClick={() => api.downloadSampleXlsx()}
            disabled={loading}
            title="Скачать образец Excel"
          >
            <span className="button-icon">↓</span>
            Образец Excel
          </button>

          <button
            className="header-button header-button-secondary"
            onClick={handleRandom}
            disabled={loading}
          >
            <span className="button-icon">✦</span>
            Случайные данные
          </button>

          <button
            className="header-button header-button-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <span className="button-icon">↑</span>
            Загрузить файл
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <main className="content">
        {error && (
          <div className="form-error global-error">
            <span>!</span>
            {error}
          </div>
        )}

        {!active ? (
          <section className="workspace">
            <div className="intro">
              <div className="eyebrow">АНАЛИТИЧЕСКАЯ ПЛАТФОРМА</div>

              <h1>
                Создайте свой
                <br />
                <span>график данных</span>
              </h1>

              <p>
                Введите показатели вручную или загрузите готовую таблицу
                в формате CSV или Excel.
                <br />
                Нужно скачать образец, внести свои данные (если необходимо) —
                и мы превратим их в понятный визуальный график.
              </p>
            </div>

            <div className="input-card">
              <div className="card-heading">
                <div>
                  <h2>Данные для графика</h2>
                  <p>Заполните таблицу</p>
                </div>

                <div className="step-badge">
                  <span>1</span>
                  Ввод данных
                </div>
              </div>

              <ManualEntry
                onSubmit={handleManual}
                loading={loading}
              />
            </div>

            <div className="upload-hint-card">
              <div className="upload-hint-icon">↑</div>

              <div>
                <strong>Уже есть готовые данные?</strong>
                <span>
                  Загрузите CSV или Excel вместо ручного ввода
                </span>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                Выбрать файл
              </button>
            </div>

            {datasets.length > 0 && (
              <div className="recent-section">
                <div className="recent-heading">
                  <h3>Последние графики</h3>
                  <span>{datasets.length}</span>
                </div>

                <div className="recent-grid">
                  {datasets.slice(0, 4).map((dataset) => (
                    <button
                      key={dataset.id}
                      className="recent-card"
                      onClick={() => openDataset(dataset.id)}
                    >
                      <div className="recent-card-icon">↗</div>

                      <div className="recent-card-content">
                        <strong>
                          {dataset.name?.includes("Random")
                            ? "График данных"
                            : dataset.name || "График данных"}
                        </strong>

                        <span>Открыть график</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="chart-workspace">
            <div className="chart-header">
              <div>
                <div className="eyebrow">РЕЗУЛЬТАТ</div>
                <h1>Ваш график</h1>
                <p>
                  Данные визуализированы. Наведите курсор на график,
                  чтобы посмотреть значения.
                </p>
              </div>

              <button
                className="back-button"
                onClick={startNewDataset}
              >
                <span>←</span>
                Вернуться к вводу данных
              </button>
            </div>

            <div className="chart-card">
              <div className="chart-card-top">
                <div>
                  <span className="chart-label">ВИЗУАЛИЗАЦИЯ</span>
                  <h2>Показатели за выбранный период</h2>
                </div>

                <div className="chart-status">
                  <span />
                  Данные загружены
                </div>
              </div>

              <div className="chart-area">
                <MultiSeriesChart series={active.series} />
              </div>

              <div className="chart-footer">
                <span>
                  Наведите курсор на точки графика для подробной информации
                </span>

                <button onClick={startNewDataset}>
                  Создать новый график →
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span>Аналитика</span>
        <span>Создание графиков из ваших данных</span>
      </footer>
    </div>
  );
}

