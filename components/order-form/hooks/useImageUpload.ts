import { useState, useRef, type ChangeEvent } from "react";

import { validateImageFile } from "../utils/validation";

export function useImageUpload() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const error = validateImageFile(file);

      if (error) {
        setImageError(error);

        return;
      }

      setUploadedImage(file);
      setImageError("");

      // 產生預覽
      const reader = new FileReader();

      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    uploadedImage,
    imagePreview,
    imageError,
    fileInputRef,
    handleImageChange,
    handleRemoveImage,
    setImageError,
  };
}
