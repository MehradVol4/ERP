"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import axiosInstance from "@/lib/axios";

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
  createdAt?: string | null;
  updatedAt?: string | null;
  products: SaleItemResponse[] | null;
};

type SalesViewProps = {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function SalesView({ documentId, open, onOpenChange }: SalesViewProps) {
  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!open || !documentId) return;
    let active = true;
    setStatus("loading");
    setSale(null);
    axiosInstance
      .get<{ data: SaleResponse }>(
        `/api/sales/${documentId}?populate[products][populate][product]=true`,
      )
      .then((response) => {
        if (!active) return;
        setSale(response.data.data);
        setStatus("idle");
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load invoice:", error);
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [open, documentId]);

  const items = sale?.products ?? [];
  const formatDate = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleString() : "-";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Invoice details</SheetTitle>
          <SheetDescription>
            {sale ? `#${sale.id}` : "Full record"}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6">
          {status === "loading" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              <span>Loading...</span>
            </div>
          )}
          {status === "error" && (
            <p className="text-sm text-destructive">Failed to load invoice.</p>
          )}

          {sale && status !== "error" && (
            <div className="flex flex-col gap-6">
              <div>
                <Row label="ID" value={sale.id} />
                <Row label="Document ID" value={sale.documentId} />
                <Row label="Customer name" value={sale.customer_name || "-"} />
                <Row label="Date" value={formatDate(sale.date)} />
                <Row
                  label="Total"
                  value={Number(sale.total ?? 0).toFixed(2)}
                />
                {sale.createdAt && (
                  <Row label="Created" value={formatDate(sale.createdAt)} />
                )}
                {sale.updatedAt && (
                  <Row label="Updated" value={formatDate(sale.updatedAt)} />
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium">Items</h3>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items.</p>
                ) : (
                  <table className="w-full text-sm">
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
                          (Number(item.quantity) || 0) *
                          (Number(item.price) || 0);
                        return (
                          <tr key={index} className="border-b">
                            <td className="py-2">{item.product?.name || "-"}</td>
                            <td className="py-2 text-right">
                              {item.quantity ?? 0}
                            </td>
                            <td className="py-2 text-right">
                              {(item.price ?? 0).toFixed(2)}
                            </td>
                            <td className="py-2 text-right">
                              {amount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default SalesView;
