import type { Metadata } from "next";
import { MenuCatalog } from "@/components/menu-catalog";

export const metadata: Metadata = {
  title: "The Menu",
  description: "Explore Amara Bakery's daily breads, pastries, and cakes.",
};

export default function MenuPage() {
  return <MenuCatalog />;
}
