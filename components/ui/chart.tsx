"use client";

import * as React from "react";
import { ReferenceLine, ResponsiveContainer } from "recharts";

import { cn } from "@/utils";

// Chart container component
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: Record<string, any>;
    children: React.ComponentProps<typeof ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <div
      data-chart={chartId}
      ref={ref}
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className,
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartStyle = ({
  id,
  config,
}: {
  id: string;
  config: Record<string, any>;
}) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color,
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: [
          `[data-chart=${id}] {`,
          ...colorConfig.map(([key, itemConfig]) => {
            const color = itemConfig.theme?.light ?? itemConfig.color;
            return color ? `  --color-${key}: ${color};` : null;
          }),
          `}`,
          `[data-chart=${id}][data-theme=dark] {`,
          ...colorConfig.map(([key, itemConfig]) => {
            const color = itemConfig.theme?.dark ?? itemConfig.color;
            return color ? `  --color-${key}: ${color};` : null;
          }),
          `}`,
        ]
          .filter(Boolean)
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean;
    payload?: Array<any>;
    label?: string;
  }
>(({ active, payload, label, className, ...props }, ref) => {
  if (active && payload && payload.length) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-background p-2 shadow-md outline-none",
          className,
        )}
        {...props}
      >
        <div className="grid gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
          </div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                style={
                  {
                    "--color-bg": `var(--color-${entry.dataKey})`,
                  } as React.CSSProperties
                }
              />
              <span className="text-muted-foreground">{entry.dataKey}:</span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
});
ChartTooltip.displayName = "ChartTooltip";

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean;
    payload?: Array<any>;
    label?: string;
    labelFormatter?: (label: any, payload: any) => React.ReactNode;
    formatter?: (value: any, name: any, props: any) => React.ReactNode;
    indicator?: "line" | "dot" | "dashed";
    hideLabel?: boolean;
    hideIndicator?: boolean;
    nameKey?: string;
    labelKey?: string;
  }
>(
  (
    {
      active,
      payload,
      label,
      labelFormatter,
      formatter,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      nameKey,
      labelKey,
      className,
      ...props
    },
    ref,
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || "value"}`;
      const itemConfig = item.payload?.config?.[key] || {};
      const value =
        !labelFormatter && item.payload?.[labelKey || item.dataKey || item.name]
          ? item.payload[labelKey || item.dataKey || item.name]
          : label;

      if (labelFormatter) {
        return labelFormatter(value, payload);
      }

      return value;
    }, [label, labelFormatter, payload, hideLabel, labelKey]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
        )}
        {...props}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = item.payload?.config?.[key] || {};
            const indicatorColor = item.color || `var(--color-${key})`;

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            },
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: Array<any>;
  }
>(({ className, payload, ...props }, ref) => {
  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    >
      {payload.map((item) => {
        const key = `${item.dataKey || item.value}`;
        const itemConfig = item.payload?.config?.[key] || {};

        return (
          <div
            key={item.value}
            className={cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
            )}
          >
            {itemConfig?.icon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            <span className="text-muted-foreground">
              {itemConfig?.label || item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegend.displayName = "ChartLegend";

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend };
