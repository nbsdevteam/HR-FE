type AccountInfoRowProps = {
  label: string;
  value: string;
};

const AccountInfoRow = ({ label, value }: AccountInfoRowProps) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
    <span className="text-foreground" style={{ fontSize: 13 }}>{label}</span>
    <span className="text-muted-foreground" style={{ fontSize: 13 }}>{value}</span>
  </div>
);

export default AccountInfoRow;
