import { AlertCircle } from "lucide-react";

type PublicLeaveNoticeProps = {
  tone: "error" | "info";
  title: string;
  body: string;
};

/** Dead-end screen — reused for every `unusable_reason` value, `invalid_link`, and the "can't verify you" cases. */
const PublicLeaveNotice = ({ tone, title, body }: PublicLeaveNoticeProps) => {
  const color = tone === "error" ? "text-destructive" : "text-primary";

  return (
    <div className="py-10 text-center">
      <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${color}`} />
      <h2 className="text-foreground mb-2" style={{ fontSize: 18 }}>{title}</h2>
      <p className="text-muted-foreground" style={{ fontSize: 13 }}>{body}</p>
    </div>
  );
};

export default PublicLeaveNotice;
