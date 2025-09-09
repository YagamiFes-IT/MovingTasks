// src/components/editor/EditAreaModal.tsx

import { useState, useEffect } from "react";
import { Area } from "../../types/entities";
import "./DataInspector.css";

interface EditAreaModalProps {
  area: Area | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, newName: string, newDescription: string) => void;
}

export function EditAreaModal({ area, isOpen, onClose, onSave }: EditAreaModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (area) {
      setName(area.name);
      setDescription(area.description);
    }
  }, [area]);

  if (!isOpen || !area) return null;

  const handleSave = () => {
    onSave(area.key, name, description);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Area: {area.key}</h2>
        <div className="edit-node-form">
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <label>Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
