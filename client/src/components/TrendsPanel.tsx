import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import type { Trend } from "../types";

type Props = {
  country?: string;
  trends: Trend[];
  loading: boolean;
  breakoutOnly: boolean;
  windowDays: number;
};

export function TrendsPanel({ country, trends, loading, breakoutOnly, windowDays }: Props) {
  const topTrends = trends.slice(0, 15);
  const chartOption = useMemo(() => {
    const items = topTrends.slice(0, 10).reverse();
    return {
      backgroundColor: "transparent",
      grid: { left: 120, right: 20, top: 10, bottom: 10 },
      xAxis: {
        type: "value",
        axisLabel: { color: "#8aa0c2" },
        splitLine: { show: true, lineStyle: { color: "rgba(255,255,255,0.05)" } }
      },
      yAxis: {
        type: "category",
        data: items.map((t) => t.term),
        axisLabel: { color: "#eaf3ff", fontWeight: 600 }
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" }
      },
      series: [
        {
          type: "bar",
          data: items.map((t) => t.score ?? 0),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 1, [
              { offset: 0, color: "#5dd6ff" },
              { offset: 1, color: "#0e85b7" }
            ])
          },
          barWidth: 16
        }
      ]
    };
  }, [topTrends]);

  return (
    <div className="panel">
      <div className="header">
        <div>
          <div className="label">Top searches</div>
          <div className="title">{country || "Select a country"}</div>
        </div>
        <div className="pill">
          {breakoutOnly ? "Breakouts" : "All terms"} · {windowDays}d window
        </div>
      </div>

      {loading ? (
        <div className="muted">Loading trends…</div>
      ) : !country ? (
        <div className="muted">Pick a country on the globe to see its searches.</div>
      ) : topTrends.length === 0 ? (
        <div className="muted">No data yet. Trigger an ingest first.</div>
      ) : (
        <>
          <div className="chart-card">
            <ReactECharts echarts={echarts} style={{ height: 360 }} option={chartOption} />
          </div>
          <div className="list">
            {topTrends.map((t, idx) => (
              <div key={t.term} className="trend-item">
                <div>
                  <div className="label">#{idx + 1}</div>
                  <div className="trend-term">{t.term}</div>
                </div>
                {t.breakout_flag ? <span className="tag">Breakout</span> : null}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
