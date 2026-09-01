import type { GradeBand } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { BAND_BG_CLASS } from "../utils/gradeLadder";

const BAND_ORDER: GradeBand[] = ["leadership", "middle", "delivery"];

const BAND_LABEL_KEY: Record<GradeBand, "hierarchy.band_leadership" | "hierarchy.band_middle" | "hierarchy.band_delivery"> = {
  leadership: "hierarchy.band_leadership",
  middle: "hierarchy.band_middle",
  delivery: "hierarchy.band_delivery",
};

/** The three-band key shown above the ladder — band colour is ordinal (most senior darkest), never used as a series colour elsewhere in the app. */
const GradeBandLegend = () => (
  <div className="flex flex-wrap items-center gap-4">
    {BAND_ORDER.map((band) => (
      <span key={band} className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 12 }}>
        <span className={`w-3 h-3 rounded-full ${BAND_BG_CLASS[band]}`} />
        {arabicSource(BAND_LABEL_KEY[band])}
      </span>
    ))}
  </div>
);

export default GradeBandLegend;
