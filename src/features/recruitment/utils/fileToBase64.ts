export const fileToBase64 = (file: File): Promise<string> => (
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(((reader.result as string) || "").split(",").pop() || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })
);
