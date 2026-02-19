import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import type { ChartData, ChartOptions } from "chart.js";

type PieChartProps = {
  data: ChartData<"pie", number[], string>;
  options?: ChartOptions<"pie">;
  className?: string;
};

export function PieChart({ data, options, className = "" }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const baseOptions: ChartOptions<"pie"> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#cbd5f5",
          },
        },
      },
    };

    const chart = new Chart(canvasRef.current, {
      type: "pie",
      data,
      options: {
        ...baseOptions,
        ...options,
        plugins: {
          ...baseOptions.plugins,
          ...options?.plugins,
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [data, options]);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}
