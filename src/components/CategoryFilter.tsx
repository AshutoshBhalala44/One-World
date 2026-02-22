import { categories } from "@/data/polls";
import { motion } from "framer-motion";

export function CategoryFilter({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            selected === cat.id
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          {selected === cat.id && (
            <motion.div
              layoutId="category-pill"
              className="absolute inset-0 bg-navy rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <span>{cat.icon}</span>
            {cat.label}
          </span>
        </button>
      ))}
    </div>
  );
}
