"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Spinner } from "@/components/ui/spinner";
import SalesForm, { type SaleFormValues } from "../../features/sales-form";

type SaleItemResponse = {
  quantity: number | null;
  price: number | null;
  product: { id: number } | null;
};

type SaleResponse = {
  documentId: string;
  customer_name: string | null;
  customer: { id: number } | null;
  date: string | null;
  products: SaleItemResponse[] | null;
};

const Page = () => {
  const params = useParams<{ documentId: string }>();
  const documentId = params.documentId;
  const [sale, setSale] = useState<SaleFormValues | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!documentId) return;
    let active = true;
    setStatus("loading");
    axiosInstance
      .get<{ data: SaleResponse }>(
        `/api/sales/${documentId}?populate[products][populate][product]=true&populate[customer][fields][0]=id`,
      )
      .then((response) => {
        if (!active) return;
        const data = response.data.data;
        setSale({
          documentId: data.documentId,
          customer: data.customer?.id ?? null,
          customer_name: data.customer_name ?? "",
          date: data.date ?? new Date().toISOString(),
          products: (data.products ?? []).map((item) => ({
            product: item.product?.id ?? 0,
            quantity: item.quantity ?? 1,
            price: item.price ?? 0,
          })),
        });
        setStatus("ready");
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load invoice:", error);
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [documentId]);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 py-4 md:py-6 px-4 lg:px-6 text-muted-foreground">
        <Spinner />
        <span>Loading invoice...</span>
      </div>
    );
  }

  if (status === "error" || !sale) {
    return (
      <div className="py-4 md:py-6 px-4 lg:px-6">
        <p className="text-destructive">Failed to load invoice.</p>
      </div>
    );
  }

  return <SalesForm sale={sale} />;
};

export default Page;
