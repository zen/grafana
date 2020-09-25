import React, { useEffect, useState } from 'react';
import {
  Canvas,
  ContextMenuPlugin,
  LegendDisplayMode,
  LegendPlugin,
  TooltipPlugin,
  UPlotChart,
  ZoomPlugin,
} from '@grafana/ui';
import { DataFrame, PanelProps } from '@grafana/data';
import { Options } from './types';
import { alignAndSortDataFramesByFieldName } from './utils';
import { VizLayout } from './VizLayout';

interface GraphPanelProps extends PanelProps<Options> {}

const TIME_FIELD_NAME = 'Time';

export const GraphPanel: React.FC<GraphPanelProps> = ({
  data,
  timeRange,
  timeZone,
  width,
  height,
  options,
  onChangeTimeRange,
}) => {
  const [alignedData, setAlignedData] = useState<DataFrame | null>(null);
  useEffect(() => {
    if (!data || !data.series?.length) {
      setAlignedData(null);
      return;
    }

    const subscription = alignAndSortDataFramesByFieldName(data.series, TIME_FIELD_NAME).subscribe(setAlignedData);

    return function unsubscribe() {
      subscription.unsubscribe();
    };
  }, [data]);

  if (!alignedData) {
    return (
      <div className="panel-empty">
        <p>No data found in response</p>
      </div>
    );
  }

  return (
    <VizLayout width={width} height={height}>
      {({ builder, getLayout }) => {
        const layout = getLayout();
        // when all layout slots are ready we can calculate the canvas(actual viz) size
        const canvasSize = layout.isReady
          ? {
              width: width - (layout.left.width + layout.right.width),
              height: height - (layout.top.height + layout.bottom.height),
            }
          : { width: 0, height: 0 };

        if (options.legend.isVisible) {
          builder.addSlot(
            options.legend.placement,
            <LegendPlugin
              placement={options.legend.placement}
              displayMode={options.legend.asTable ? LegendDisplayMode.Table : LegendDisplayMode.List}
            />
          );
        } else {
          builder.clearSlot(options.legend.placement);
        }

        return (
          <UPlotChart data={alignedData} timeRange={timeRange} timeZone={timeZone} {...canvasSize}>
            {builder.addSlot('canvas', <Canvas />).render()}
            <TooltipPlugin mode={options.tooltipOptions.mode as any} timeZone={timeZone} />
            <ZoomPlugin onZoom={onChangeTimeRange} />
            <ContextMenuPlugin />

            {/* TODO: */}
            {/*<AnnotationsEditorPlugin />*/}
          </UPlotChart>
        );
      }}
    </VizLayout>
  );
};
