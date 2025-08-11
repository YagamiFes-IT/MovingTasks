// src/components/editor/EditGroupModal.tsx

import { useState, useEffect } from "react";
import { Group } from "../../types/entities";
import "./DataInspector.css";

interface EditGroupModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, newName: string, newDescription: string) => void;
}

export function EditGroupModal({ group, isOpen, onClose, onSave }: EditGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description);
    }
  }, [group]);

  if (!isOpen || !group) return null;

  const handleSave = () => {
    onSave(group.key, name, description);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Group: {group.key}</h2>
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
