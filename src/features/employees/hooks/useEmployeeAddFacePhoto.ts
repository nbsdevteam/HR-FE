import { useState, useCallback } from "react";

/** Step 2's photo picker state — read/reset, no data URL prefix on the base64 copy device-sync expects. */
export const useEmployeeAddFacePhoto = () => {
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [facePhotoBase64, setFacePhotoBase64] = useState<string | null>(null);
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null);

  const handleClearFacePhoto = useCallback(() => {
    setFacePhotoPreview(null);
    setFacePhotoBase64(null);
    setPhotoError(null);
  }, []);

  const handleFacePhoto = useCallback((file: File) => {
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFacePhotoPreview(result);
      setFacePhotoBase64(result.split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  }, []);

  return {
    photoError,
    setPhotoError,
    facePhotoBase64,
    facePhotoPreview,
    handleClearFacePhoto,
    handleFacePhoto,
  };
};
