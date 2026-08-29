import type { ReactNode } from "react";
import { arabicSource } from "@/i18n/source";
import TypeListItem, { type NamedTypeRecord } from "./TypeListItem";

type TypeListProps<T extends NamedTypeRecord> = {
  items: T[];
  loading: boolean;
  descriptionLine: (item: T) => ReactNode;
  onToggleActive: (item: T) => void;
  onDelete: (id: string) => void;
};

const TypeList = <T extends NamedTypeRecord,>({
  items,
  loading,
  descriptionLine,
  onToggleActive,
  onDelete,
}: TypeListProps<T>) => {
  if (loading) {
    return (
      <p className="text-muted-foreground text-sm text-center py-4">
        {arabicSource("common.loading")}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {items?.map((item) => (
        <TypeListItem
          key={item.id}
          item={item}
          descriptionLine={descriptionLine}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default TypeList;
