"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";

import { createClient } from "@/lib/supabase/client";

interface StorePlaceholderEditorProps {
  storeId: string;
  currentPlaceholder: string | null;
  onSuccess: () => void;
}

export default function StorePlaceholderEditor({
  storeId,
  currentPlaceholder,
  onSuccess,
}: StorePlaceholderEditorProps) {
  const [placeholder, setPlaceholder] = useState<string>(currentPlaceholder || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmedPlaceholder = placeholder.trim() || null;

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stores")
        .update({ menu_placeholder: trimmedPlaceholder })
        .eq("id", storeId);

      if (error) throw error;

      onSuccess();
    } catch {
      alert("更新失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setPlaceholder("");

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stores")
        .update({ menu_placeholder: null })
        .eq("id", storeId);

      if (error) throw error;

      onSuccess();
    } catch {
      alert("清除失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        className="w-full"
        minRows={2}
        placeholder="例如：大麥克套餐 x2（去洋蔥）&#10;薯條大份 x1"
        size="sm"
        value={placeholder}
        onChange={(e) => setPlaceholder(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button
          className="flex-1"
          color="success"
          isLoading={isSaving}
          size="sm"
          variant={currentPlaceholder ? "flat" : "solid"}
          onPress={handleSave}
        >
          {currentPlaceholder ? "更新提示文字" : "儲存提示文字"}
        </Button>
        {currentPlaceholder && (
          <Button
            color="default"
            isLoading={isSaving}
            size="sm"
            variant="bordered"
            onPress={handleClear}
          >
            清除
          </Button>
        )}
      </div>
      <p className="text-xs text-default-400">
        此文字會顯示在點餐內容欄位的提示中，若留空則使用預設提示
      </p>
    </div>
  );
}
