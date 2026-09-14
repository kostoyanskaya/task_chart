import io
import random
from datetime import date, timedelta

import pandas as pd

from .models import SeriesType, DEFAULT_COLORS

DEFAULT_SERIES_PLAN = [
    ("Cost", SeriesType.AREA, ""),
    ("CPA", SeriesType.SPLINE, ""),
    ("ROI confirmed", SeriesType.LINE, "%"),
    ("Conversions", SeriesType.BAR, ""),
]


def generate_random_dataset(days: int = 14):
    """Build an in-memory dataset dict matching
    DatasetCreateSerializer input shape."""
    today = date.today()
    dates = [
        today - timedelta(days=days - 1 - i) for i in range(days)
    ]

    series = []
    cost_base = random.uniform(20, 60)
    for name, s_type, unit in DEFAULT_SERIES_PLAN:
        points = []
        if s_type == SeriesType.AREA:  # Cost - trending, noisy
            val = cost_base
            for d in dates:
                val = max(5, val + random.uniform(-6, 8))
                points.append({"date": d, "value": round(val, 2)})
        elif s_type == SeriesType.SPLINE:  # CPA - smooth small values
            val = random.uniform(0.8, 2.5)
            for d in dates:
                val = max(0.1, val + random.uniform(-0.3, 0.3))
                points.append({"date": d, "value": round(val, 2)})
        elif s_type == SeriesType.LINE:  # ROI confirmed - can dip
            val = random.uniform(80, 180)
            for d in dates:
                val = max(0, val + random.uniform(-15, 18))
                points.append({"date": d, "value": round(val, 2)})
        else:  # BAR - Conversions, integer-ish counts
            val = random.uniform(10, 40)
            for d in dates:
                val = max(0, val + random.uniform(-8, 8))
                points.append({"date": d, "value": round(val)})
        series.append(
            {
                "name": name,
                "type": s_type,
                "unit": unit,
                "color": DEFAULT_COLORS[s_type],
                "points": points,
            }
        )

    return {
        "name": f"Random dataset {today.isoformat()}",
        "series": series,
    }


SERIES_TYPE_CYCLE = [
    SeriesType.AREA,
    SeriesType.SPLINE,
    SeriesType.LINE,
    SeriesType.BAR,
]


def parse_tabular_file(file_obj, filename: str, series_types=None):
    """
    Parse a CSV or Excel file in 'wide' format:
        date, <series 1 name>, <series 2 name>, ..., <series 4 name>

    The first column must be parseable as a date. Up to 4 remaining
    columns become series, in file order, assigned types from
    `series_types` (list) or cycling through area/spline/line/bar
    if not provided.

    Returns a dict matching DatasetCreateSerializer input shape,
    or raises ValueError.
    """
    lower = filename.lower()
    if lower.endswith(".csv"):
        df = pd.read_csv(file_obj)
    elif lower.endswith(".xlsx") or lower.endswith(".xls"):
        df = pd.read_excel(file_obj)
    else:
        raise ValueError(
            "Неподдерживаемый тип файла. Загрузите файл "
            ".csv, .xlsx или .xls."
        )

    if df.shape[1] < 2:
        raise ValueError(
            "В файле должен быть столбец с датой и хотя бы "
            "один столбец со значениями."
        )

    df = df.dropna(how="all")
    date_col = df.columns[0]
    value_cols = list(df.columns[1:5])  # max 4 series

    try:
        df[date_col] = pd.to_datetime(df[date_col]).dt.date
    except Exception as exc:
        raise ValueError(
            f"Не удалось распознать даты в первом столбце "
            f"'{date_col}'."
        ) from exc

    df = df.sort_values(date_col)

    series = []
    for idx, col in enumerate(value_cols):
        s_type = (
            series_types[idx]
            if series_types and idx < len(series_types)
            else SERIES_TYPE_CYCLE[idx % 4]
        )
        points = []
        for _, row in df.iterrows():
            raw_value = row[col]
            if pd.isna(raw_value):
                continue
            try:
                value = float(raw_value)
            except (TypeError, ValueError):
                continue
            points.append(
                {"date": row[date_col], "value": round(value, 2)}
            )
        series.append(
            {
                "name": str(col),
                "type": s_type,
                "unit": "",
                "color": DEFAULT_COLORS.get(s_type, "#888888"),
                "points": points,
            }
        )

    if not series or all(len(s["points"]) == 0 for s in series):
        raise ValueError(
            "В файле не найдено ни одной корректной точки данных."
        )

    return {"name": f"Imported: {filename}", "series": series}
