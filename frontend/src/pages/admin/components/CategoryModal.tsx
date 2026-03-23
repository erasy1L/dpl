import { useEffect, useState } from "react";
import { Button, Input, Modal } from "../../../components/ui";
import { Category } from "../../../types/attraction.types";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  mode: "create" | "edit";
  category?: Category | null;
  onSubmit: (data: { name_en: string; name_ru?: string; icon: string }) => Promise<void>;
}

const CategoryModal = ({
  isOpen,
  onClose,
  saving,
  mode,
  category,
  onSubmit,
}: CategoryModalProps) => {
  const [nameEn, setNameEn] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [icon, setIcon] = useState("map-pin");

  useEffect(() => {
    if (mode === "edit" && category) {
      setNameEn(category.name_en || "");
      setNameRu(category.name_ru || "");
      setIcon(category.icon || "map-pin");
      return;
    }
    setNameEn("");
    setNameRu("");
    setIcon("map-pin");
  }, [mode, category, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create category" : "Edit category"}
      size="md"
    >
      <div className="space-y-4">
        <Input label="Name (EN)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        <Input label="Name (RU)" value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
        <Input label="Icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSubmit({ name_en: nameEn, name_ru: nameRu || undefined, icon })}
            isLoading={saving}
          >
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryModal;

