import { useEffect, useRef } from "react";
import * as echarts from "echarts";

const COLORS = {
  area: "#F2D675",
  spline: "#3B6FF2",
  line: "#249126",
  bar: "#A900F5",
};

export default function MultiSeriesChart({ series, height = 294 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current, null, {
      renderer: "svg",
    });

    chartRef.current = chart;

    const resize = () => {
      chart.resize();
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);

      if (chartRef.current) {
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart || !series?.length) return;

    /*
     * Собираем все даты из всех серий.
     */
    const dateSet = new Set();

    series.forEach((s) => {
      (s.points || []).forEach((p) => {
        if (p.date) {
          dateSet.add(p.date);
        }
      });
    });

    const dates = [...dateSet].sort();

    /*
     * Отдельная шкала для каждой серии.
     */
    const yAxis = series.map((s) => {
      const values = (s.points || [])
        .map((p) => Number(p.value))
        .filter((v) => Number.isFinite(v));

      if (!values.length) {
        return {
          type: "value",
          show: false,
        };
      }

      const min = Math.min(...values);
      const max = Math.max(...values);

      if (min === max) {
        const padding = Math.abs(max || 1) * 0.2;

        return {
          type: "value",
          show: false,
          min: min - padding,
          max: max + padding,
          scale: true,
        };
      }

      const range = max - min;

      return {
        type: "value",
        show: false,
        scale: true,

        min: (value) => {
          if (value.min >= 0) {
            return 0;
          }

          return value.min - range * 0.08;
        },

        max: (value) => {
          return value.max + range * 0.12;
        },

        splitLine: {
          show: false,
        },

        axisLine: {
          show: false,
        },

        axisTick: {
          show: false,
        },

        axisLabel: {
          show: false,
        },
      };
    });

    /*
     * Создаём серии.
     */
    const echartSeries = series.map((s, index) => {
      const color = s.color || COLORS[s.type] || "#888888";

      /*
       * Важно:
       * для каждой даты ищем именно её значение.
       */
      const data = dates.map((date) => {
        const point = (s.points || []).find(
          (p) => p.date === date
        );

        return point ? Number(point.value) : null;
      });

      /*
       * COST
       */
      if (s.type === "area") {
        return {
          name: s.name,
          type: "line",
          yAxisIndex: index,
          data,

          smooth: false,

          symbol: "none",
          showSymbol: false,

          connectNulls: false,

          lineStyle: {
            width: 0,
            color: "transparent",
          },

          areaStyle: {
            color: "#FFF1B8",
            opacity: 0.72,
          },

          emphasis: {
            disabled: true,
          },

          z: 1,
        };
      }

      /*
       * CPA
       */
      if (s.type === "spline") {
        return {
          name: s.name,
          type: "bar",
          yAxisIndex: index,
          data,

          barWidth: 32,
          barMaxWidth: 32,

          itemStyle: {
            color,
            borderRadius: [3, 3, 0, 0],
          },

          emphasis: {
            focus: "series",
          },

          z: 3,
        };
      }

      /*
       * ROI CONFIRMED
       */
      if (s.type === "line") {
        return {
          name: s.name,
          type: "line",
          yAxisIndex: index,
          data,

          smooth: 0.45,

          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,

          lineStyle: {
            width: 4,
            color,
            cap: "round",
            join: "round",
          },

          itemStyle: {
            color,
            borderColor: "#FFFFFF",
            borderWidth: 2,
          },

          emphasis: {
            focus: "series",
            scale: true,
          },

          z: 6,
        };
      }

      /*
       * CONVERSIONS
       *
       * Backend всё ещё может передавать type="bar",
       * но визуально это линия с квадратами,
       * как на референсе.
       */
      return {
        name: s.name,
        type: "line",
        yAxisIndex: index,
        data,

        smooth: false,

        symbol: "rect",
        symbolSize: 10,

        showSymbol: true,

        lineStyle: {
          width: 2,
          color,
          cap: "square",
        },

        itemStyle: {
          color,
        },

        emphasis: {
          focus: "series",
          scale: true,
        },

        z: 10,
      };
    });

    /*
     * ==========================================================
     * TOOLTIP
     * ==========================================================
     *
     * Здесь главное исправление.
     *
     * НЕ используем только params.
     * Берём дату из params[0], а потом самостоятельно
     * ищем эту дату в КАЖДОЙ серии.
     *
     * Поэтому tooltip всегда показывает:
     *
     * Cost
     * CPA
     * ROI confirmed
     * Conversions
     */
    const tooltip = {
      trigger: "axis",

      confine: false,

      appendToBody: true,

      /*
       * Не рисуем вертикальную линию.
       */
      axisPointer: {
        type: "none",
      },

      backgroundColor: "#FFFFFF",

      borderWidth: 1,
      borderColor: "#D7D7D7",

      borderRadius: 5,

      padding: [13, 16, 14, 16],

      extraCssText: `
        width: 332px;
        box-sizing: border-box;

        box-shadow:
          0 5px 14px rgba(0, 0, 0, 0.23),
          0 1px 3px rgba(0, 0, 0, 0.12);

        font-family: Arial, Helvetica, sans-serif;

        z-index: 999999;
      `,

      textStyle: {
        color: "#292929",
        fontFamily: "Arial, Helvetica, sans-serif",
      },

      formatter: (params) => {
        if (!params?.length) {
          return "";
        }

        /*
         * Получаем дату, на которую навели мышь.
         */
        const date = params[0].axisValue;

        /*
         * Создаём строку для КАЖДОЙ серии.
         */
        const rows = series
          .map((s) => {
            const point = (s.points || []).find(
              (p) => p.date === date
            );

            /*
             * Если у серии нет данных в этой дате,
             * всё равно можно не показывать значение.
             */
            if (!point) {
              return "";
            }

            const color =
              s.color ||
              COLORS[s.type] ||
              "#888888";

            const value = formatValue(point.value);

            return `
              <div
                style="
                  display:flex;
                  align-items:center;
                  height:30px;
                  line-height:30px;
                  white-space:nowrap;
                "
              >
                <span
                  style="
                    display:inline-block;
                    width:20px;
                    height:20px;
                    min-width:20px;
                    border-radius:50%;
                    background:${color};
                    margin-right:9px;
                  "
                ></span>

                <span
                  style="
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:25px;
                    line-height:30px;
                    font-weight:400;
                    color:#292929;
                    letter-spacing:-0.7px;
                  "
                >
                  ${escapeHtml(s.name)}:
                </span>

                <span
                  style="
                    font-family:Arial, Helvetica, sans-serif;
                    font-size:25px;
                    line-height:30px;
                    font-weight:700;
                    color:#292929;
                    margin-left:5px;
                    letter-spacing:-0.7px;
                  "
                >
                  ${escapeHtml(value)}${escapeHtml(s.unit || "")}
                </span>
              </div>
            `;
          })
          .join("");

        return `
          <div
            style="
              width:100%;
              font-family:Arial, Helvetica, sans-serif;
            "
          >
            <div
              style="
                font-size:20px;
                line-height:25px;
                font-weight:400;
                color:#292929;
                margin-bottom:2px;
              "
            >
              ${escapeHtml(formatDateForTooltip(date))}
            </div>

            ${rows}
          </div>
        `;
      },
    };

    const option = {
      animation: false,

      backgroundColor: "transparent",

      /*
       * Это теперь только область самого графика.
       */
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,

        containLabel: false,

        show: false,
      },

      xAxis: {
        type: "category",

        data: dates,

        boundaryGap: false,

        axisLine: {
          show: false,
        },

        axisTick: {
          show: false,
        },

        axisLabel: {
          show: false,
        },

        splitLine: {
          show: false,
        },
      },

      yAxis,

      series: echartSeries,

      tooltip,
    };

    chart.setOption(option, true);

    requestAnimationFrame(() => {
      chart.resize();
    });
  }, [series]);

  return (
    <div className="chart-frame">
      <div
        ref={containerRef}
        className="multi-series-chart"
        style={{
          width: "100%",
          height: `${height}px`,
        }}
      />
    </div>
  );
}


/*
 * 44.36
 * 1.23
 * 161.47
 * 36
 */
function formatValue(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value ?? "");
  }

  return number.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}


/*
 * Если backend отдаёт:
 * 2026-06-12
 *
 * tooltip показывает:
 * 12.06.2026
 */
function formatDateForTooltip(date) {
  if (!date) return "";

  const value = String(date);

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return value;
  }

  return `${match[3]}.${match[2]}.${match[1]}`;
}


function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}