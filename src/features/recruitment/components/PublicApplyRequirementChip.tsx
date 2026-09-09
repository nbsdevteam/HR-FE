type TPublicApplyRequirementChipProps = {
  requirement: string;
};

const PublicApplyRequirementChip = ({ requirement }: TPublicApplyRequirementChipProps) => (
  <span
    className="px-2 py-1 rounded-md bg-muted/20 border border-border/40 text-foreground"
    style={{ fontSize: 11 }}
  >
    {requirement}
  </span>
);

export default PublicApplyRequirementChip;
