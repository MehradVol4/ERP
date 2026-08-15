"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { PrinterIcon } from "lucide-react";

type SaleItemResponse = {
  quantity: number | null;
  price: number | null;
  product: { id: number; name: string | null } | null;
};

type SaleResponse = {
  id: number;
  documentId: string;
  customer_name: string | null;
  date: string | null;
  total: number | null;
  products: SaleItemResponse[] | null;
};

const Page = () => {
  const params = useParams<{ documentId: string }>();
  const documentId = params.documentId;
  const router = useRouter();
  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!documentId) return;
    let active = true;
    setStatus("loading");
    axiosInstance
      .get<{ data: SaleResponse }>(
        `/api/sales/${documentId}?populate[products][populate][product]=true`,
      )
      .then((response) => {
        if (!active) return;
        setSale(response.data.data);
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

  // Open the print dialog automatically once the invoice is rendered.
  useEffect(() => {
    if (status === "ready") {
      const timer = window.setTimeout(() => window.print(), 300);
      return () => window.clearTimeout(timer);
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  if (status === "error" || !sale) {
    return (
      <div className="p-6">
        <p className="text-destructive">Failed to load invoice.</p>
      </div>
    );
  }

  const items = sale.products ?? [];
  const computedTotal = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0,
  );
  const total = sale.total ?? computedTotal;
  const formattedDate = sale.date
    ? new Date(sale.date).toLocaleString()
    : "-";

  return (
    <div className="mx-auto max-w-3xl p-6 print:p-0">
      {/* Toolbar — hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button variant="outline" onClick={() => router.push("/dashboard/sales")}>
          Back
        </Button>
        <Button onClick={() => window.print()}>
          <PrinterIcon />
          Print
        </Button>
      </div>

      <div className="rounded-lg border p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Invoice</h1>
            <p className="text-sm text-muted-foreground">#{sale.id}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{sale.customer_name || "-"}</p>
            <p className="text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Product</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const amount =
                (Number(item.quantity) || 0) * (Number(item.price) || 0);
              return (
                <tr key={index} className="border-b">
                  <td className="py-2">{item.product?.name || "-"}</td>
                  <td className="py-2 text-right">{item.quantity ?? 0}</td>
                  <td className="py-2 text-right">
                    {(item.price ?? 0).toFixed(2)}
                  </td>
                  <td className="py-2 text-right">{amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-4 text-right font-medium">
                Total
              </td>
              <td className="pt-4 text-right text-lg font-semibold">
                {Number(total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default Page;
