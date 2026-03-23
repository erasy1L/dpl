import { useState } from "react";
import { Button, Input, Modal } from "../../../components/ui";
import { Category } from "../../../types/attraction.types";

interface CreateAttractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  saving: boolean;
  onSubmit: (data: {
    name: string;
    city: string;
    description: string;
    categoryIds: number[];
  }) => Promise<void>;
}

const CreateAttractionModal = ({
  isOpen,
  onClose,
  categories,
  saving,
  onSubmit,
}: CreateAttractionModalProps) => {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [categoryIds, setCategoryIds] = useState<number[]>([]);

  const handleSubmit = async () => {
    await onSubmit({ name, city, description, categoryIds });
    setName("");
    setCity("");
    setDescription("");
    setCategoryIds([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create attraction" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name (localized)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="City (localized)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description (localized)
          </label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[96px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Categories</h4>
          <div className="space-y-2 max-h-48 overflow-auto pr-1">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm text-gray-900">
                <input
                  type="checkbox"
                  checked={categoryIds.includes(c.id)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...categoryIds, c.id]
                      : categoryIds.filter((id) => id !== c.id);
                    setCategoryIds(next);
                  }}
                />
                {c.name_en}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={saving}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateAttractionModal;

