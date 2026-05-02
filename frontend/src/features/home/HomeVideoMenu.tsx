import { useEffect, useRef } from 'react';

interface HomeVideoMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HomeVideoMenu({ isOpen, onClose, onEdit, onDelete }: HomeVideoMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute right-0 top-9 w-[88px] overflow-hidden rounded-[10px] border border-[#E5E7EC] bg-white shadow-[0_8px_22px_rgba(17,24,39,0.14)]"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="flex h-11 w-full items-center px-3 text-left text-[14px] font-medium text-[#3A3D45] transition-colors hover:bg-[#F7F9FC]"
      >
        제목 수정
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="flex h-11 w-full items-center px-3 text-left text-[14px] font-medium text-[#E74C3C] transition-colors hover:bg-[#FFF6F4]"
      >
        삭제
      </button>
    </div>
  );
}
