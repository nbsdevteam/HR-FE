import { useEffect, useState } from "react";

export const useChartTheme = () => {
  const [colors, setColors] = useState({
    primary: "#D4AF37",
    card: "#1A1A1A",
    border: "rgba(212,175,55,0.2)",
    muted: "#A0A0A0",
    gridStroke: "rgba(212,175,55,0.1)",
  });

  useEffect(() => {
    const update = () => {
      const style = getComputedStyle(document.documentElement);
      setColors({
        primary: style.getPropertyValue("--primary").trim() || "#D4AF37",
        card: style.getPropertyValue("--card").trim() || "#1A1A1A",
        border: style.getPropertyValue("--border").trim() || "rgba(212,175,55,0.2)",
        muted: style.getPropertyValue("--muted-foreground").trim() || "#A0A0A0",
        gridStroke: style.getPropertyValue("--border").trim() || "rgba(212,175,55,0.1)",
      });
    };

    update();

    // Observe class changes on html element for theme switches
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const tooltipStyle = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontFamily: "Tajawal",
    color: "var(--foreground)",
  };

  return { colors, tooltipStyle };
};
