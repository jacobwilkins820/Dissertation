import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import type { ChartData, ChartOptions } from "chart.js";

// Chart.js wrapper that manages line chart
type LineChartProps = {
  data: ChartData<"line", number[], string>;
  options?: ChartOptions<"line">;
  className?: string;
};

export function LineChart({ data, options, className = "" }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Theme defaults
    const baseOptions: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#cbd5f5",
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(148, 163, 184, 0.2)",
          },
          ticks: {
            color: "#94a3b8",
          },
        },
        y: {
          grid: {
            color: "rgba(148, 163, 184, 0.2)",
          },
          ticks: {
            color: "#94a3b8",
          },
        },
      },
    };

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data,
      options: {
        ...baseOptions,
        ...options,
        plugins: {
          ...baseOptions.plugins,
          ...options?.plugins,
        },
        scales: {
          ...baseOptions.scales,
          ...options?.scales,
        },
      },
    });

    return () => {
      // Always destroy to prevent duplicate chart instances on re-render.
      chart.destroy();
    };
  }, [data, options]);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}
