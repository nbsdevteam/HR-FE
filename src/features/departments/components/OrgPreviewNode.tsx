import type { ReactNode } from "react";

type OrgPreviewNodeProps = {
  title: ReactNode;
  subtitle: ReactNode;
};

const OrgPreviewNode = ({ title, subtitle }: OrgPreviewNodeProps) => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-8 h-px bg-border/60" />
    <div className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10">
      <span className="text-foreground" style={{ fontSize: 12 }}>{title}</span>
    </div>
    <p className="text-muted-foreground" style={{ fontSize: 10 }}>{subtitle}</p>
  </div>
);

export default OrgPreviewNode;
