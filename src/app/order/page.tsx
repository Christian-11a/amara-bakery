import type { Metadata } from "next";
import { OrderView } from "@/components/order-view";

export const metadata: Metadata = {
  title: "Your Order",
  description: "Review the treats in your Amara Bakery demo order.",
};

export default function OrderPage() {
  return <OrderView />;
}
