export const fileToBase64 = (file: File): Promise<string> => (
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",").pop() || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })
);
