import { useState } from "react";

const TYPE_OPTIONS = [
  { value: "area", label: "Область" },
  { value: "spline", label: "Столбики" },
  { value: "line", label: "Линия" },
  { value: "bar", label: "Линия с точками" },
];

const DEFAULT_META = [
  {
    name: "Стоимость",
    type: "area",
    color: "#F2D675",
    unit: "",
  },
  {
    name: "CPA",
    type: "spline",
    color: "#3B6FF2",
    unit: "",
  },
  {
    name: "ROI",
    type: "line",
    color: "#249126",
    unit: "%",
  },
  {
    name: "Конверсии",
    type: "bar",
    color: "#A900F5",
    unit: "",
  },
];

function todayMinus(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function emptyRows(n = 6) {
  return Array.from({ length: n }, (_, i) => ({
    date: todayMinus(n - 1 - i),
    v1: "",
    v2: "",
    v3: "",
    v4: "",
  }));
}

export default function ManualEntry({ onSubmit, loading }) {
  const [meta, setMeta] = useState(DEFAULT_META);
  const [rows, setRows] = useState(emptyRows());
  const [error, setError] = useState(null);

  const updateMeta = (idx, field, value) => {
    setMeta((m) =>
      m.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      )
    );
  };

  const updateRow = (idx, field, value) => {
    setRows((r) =>
      r.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  };

  const addRow = () => {
    setRows((r) => [
      ...r,
      {
        date: todayMinus(0),
        v1: "",
        v2: "",
        v3: "",
        v4: "",
      },
    ]);
  };

  const removeRow = (idx) => {
    setRows((r) => r.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    setError(null);

    const fields = ["v1", "v2", "v3", "v4"];

    const seriesPayload = meta.map((s, mi) => {
      const points = rows
        .filter(
          (row) =>
            row.date &&
            row[fields[mi]] !== ""
        )
        .map((row) => ({
          date: row.date,
          value: Number(row[fields[mi]]),
        }));

      return {
        name: s.name || `Серия ${mi + 1}`,
        type: s.type,
        color: s.color,
        unit: s.unit,
        points,
      };
    });

    const nonEmpty = seriesPayload.filter(
      (s) => s.points.length > 0
    );

    if (nonEmpty.length === 0) {
      setError("Заполните хотя бы одну колонку значений.");
      return;
    }

    for (const s of nonEmpty) {
      if (
        s.points.some((p) =>
          Number.isNaN(p.value)
        )
      ) {
        setError(
          `Некорректное число в серии «${s.name}».`
        );
        return;
      }
    }

    onSubmit({
      name: "График данных",
      series: nonEmpty,
    });
  };

  return (
    <div className="manual-entry">
      <div className="series-heading">
        <span>Настройка показателей</span>
        <small>
          Название, тип и цвет каждого показателя
        </small>
      </div>

      <div className="meta-grid">
        {meta.map((s, idx) => (
          <div
            key={idx}
            className="meta-col"
            style={{ "--accent": s.color }}
          >
            <div className="meta-number">
              0{idx + 1}
            </div>

            <div className="meta-color-line">
              {/* Цвет — только отображение, без выбора */}
              <span
                className="meta-color"
                style={{
                  background: s.color,
                  display: "inline-block",
                  cursor: "default",
                }}
                title="Цвет фиксирован"
              />

              <span
                className="meta-accent"
                style={{
                  background: s.color,
                }}
              />
            </div>

            <label>Название</label>

            <input
              className="meta-name"
              value={s.name}
              readOnly
              tabIndex={-1}
              placeholder={`Показатель ${idx + 1}`}
              title="Название нельзя изменить"
            />

            <label>Отображение</label>

            <select
              className="meta-type"
              value={s.type}
              disabled
              tabIndex={-1}
              title="Тип отображения нельзя изменить"
            >
              {TYPE_OPTIONS.map((t) => (
                <option
                  key={t.value}
                  value={t.value}
                >
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="table-heading">
        <div>
          <span>Значения показателей</span>
          <small>
            Введите данные по каждой дате
          </small>
        </div>

        <span className="rows-count">
          {rows.length} строк
        </span>
      </div>

      <div className="rows-table-wrap">
        <table className="rows-table">
          <thead>
            <tr>
              <th>Дата</th>

              {meta.map((s, idx) => (
                <th key={idx}>
                  <span
                    className="dot"
                    style={{
                      background: s.color,
                    }}
                  />

                  {s.name ||
                    `Показатель ${idx + 1}`}
                </th>
              ))}

              <th aria-hidden="true" />
            </tr>
          </thead>

          <tbody>
            {rows.map((row, ridx) => (
              <tr key={ridx}>
                <td>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) =>
                      updateRow(
                        ridx,
                        "date",
                        e.target.value
                      )
                    }
                  />
                </td>

                {[
                  "v1",
                  "v2",
                  "v3",
                  "v4",
                ].map((field) => (
                  <td key={field}>
                    <input
                      type="number"
                      step="any"
                      value={row[field]}
                      onChange={(e) =>
                        updateRow(
                          ridx,
                          field,
                          e.target.value
                        )
                      }
                      placeholder="Введите значение"
                    />
                  </td>
                ))}

                <td>
                  <button
                    className="icon-btn"
                    onClick={() =>
                      removeRow(ridx)
                    }
                    title="Удалить строку"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="manual-actions">
        <button
          className="btn-ghost"
          onClick={addRow}
        >
          <span>+</span>
          Добавить строку
        </button>

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Создаём график…"
            : "Построить график"}
          {!loading && <span>→</span>}
        </button>
      </div>

      {error && (
        <div className="form-error">
          <span>!</span>
          {error}
        </div>
      )}
    </div>
  );
}

