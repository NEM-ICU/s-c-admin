import StatCard from "@/components/ui/StatCard";
import { BookOpen, Check, FileText } from "lucide-react";
import type { MenuSection } from "../types/menu";

type MenuStatsProps = {
  sections: MenuSection[];
};

export default function MenuStats({ sections }: MenuStatsProps) {
  const totalCount = sections.length;
  const activeCount = sections.filter((s) => s.is_active).length;
  const pdfCount = sections.filter((s) => s.pdf_path).length;

  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Total sections"
        value={totalCount}
        icon={<BookOpen size={20} />}
      />
      <StatCard
        label="Active sections"
        value={activeCount}
        icon={<Check size={20} />}
      />
      <StatCard
        label="PDF menus attached"
        value={pdfCount}
        icon={<FileText size={20} />}
      />
    </section>
  );
}
