import { memo } from "react";
import { AXIS_LABEL_LINE_HEIGHT } from "../chart-utils";

type ChartAxisLabelLineProps = {
  x: number;
  text: string;
  index: number;
};

const ChartAxisLabelLine = ({ x, text, index }: ChartAxisLabelLineProps) => (
  <tspan x={x} dy={index === 0 ? 0 : AXIS_LABEL_LINE_HEIGHT}>
    {text}
  </tspan>
);

const MemoChartAxisLabelLine = memo(ChartAxisLabelLine);

export default MemoChartAxisLabelLine;
