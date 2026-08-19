type UploadErrorItemProps = {
  message: string;
};

const UploadErrorItem = ({ message }: UploadErrorItemProps) => (
  <li className="text-destructive/80 ps-4" style={{ fontSize: 12 }}>• {message}</li>
);

export default UploadErrorItem;
