"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import axiosInstance from "@/lib/axios";
import type { Product } from "../../products/features/columns";
import type { Supplier } from "../../suppliers/features/columns";

const lineItemSchema = z.object({
  product: z.number().min(1, "Select a product"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  cost: z.number().min(0, "Cost can't be negative"),
});

const formSchema = z.object({
  reference: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  supplier: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Add at least one item"),
});

type FormValues = z.infer<typeof formSchema>;

const emptyItem = { product: 0, quantity: 1, cost: 0 };

const toDateTimeLocal = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

function PurchaseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference: "",
      date: toDateTimeLocal(new Date().toISOString()),
      supplier: "",
      items: [{ ...emptyItem }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Products (for the line-item picker) and suppliers (for the header).
  useEffect(() => {
    let active = true;
    axiosInstance
      .get("/api/products?pagination[pageSize]=100")
      .then((response) => {
        if (!active) return;
        setProducts(
          response.data.data.map((item: Product) => ({
            id: item.id,
            documentId: item.documentId,
            name: item.name,
            price: item.price,
            cost_price: item.cost_price,
            stock: item.stock,
            barcode: item.barcode,
            description: item.description,
          })),
        );
      })
      .catch((error) => console.error("Failed to fetch products:", error));

    axiosInstance
      .get("/api/suppliers?pagination[pageSize]=100&fields[0]=name")
      .then((response) => {
        if (!active) return;
        setSuppliers(
          response.data.data.map((s: Supplier) => ({
            id: s.id,
            documentId: s.documentId,
            name: s.name,
          })),
        );
      })
      .catch((error) => console.error("Failed to fetch suppliers:", error));

    return () => {
      active = false;
    };
  }, []);

  const watchedItems = form.watch("items");
  const total = (watchedItems ?? []).reduce(
    (sum, item) =>
      sum + (Number(item?.quantity) || 0) * (Number(item?.cost) || 0),
    0,
  );

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const payload = {
        data: {
          reference: values.reference || null,
          date: new Date(values.date).toISOString(),
          total,
          supplier: values.supplier ? Number(values.supplier) : null,
          items: values.items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            cost: item.cost,
          })),
        },
      };

      await axiosInstance.post("/api/purchases", payload);
      toast.success("Purchase recorded — stock updated!");
      router.push("/dashboard/purchases");
    } catch (error) {
      toast.error("Failed to record purchase");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>New Purchase</CardTitle>
          <CardDescription>
            <span>Record received goods — this adds to product stock</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-6 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="reference">Reference</FieldLabel>
                <Input
                  id="reference"
                  placeholder="e.g. invoice / PO number"
                  {...form.register("reference")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <Input
                  id="date"
                  type="datetime-local"
                  {...form.register("date")}
                />
                <FieldError>{form.formState.errors.date?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="supplier">Supplier</FieldLabel>
                <Controller
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="supplier">
                        <SelectValue placeholder="No supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem
                            key={supplier.id}
                            value={String(supplier.id)}
                          >
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <FieldLabel>Items</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ ...emptyItem })}
                >
                  <PlusIcon />
                  Add item
                </Button>
              </div>

              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="grid items-start gap-3 rounded-md border p-3 sm:grid-cols-[1fr_120px_140px_auto]"
                >
                  <Field>
                    <FieldLabel htmlFor={`product-${index}`}>Product</FieldLabel>
                    <Controller
                      control={form.control}
                      name={`items.${index}.product`}
                      render={({ field }) => (
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => {
                            field.onChange(Number(value));
                            const selected = products.find(
                              (p) => p.id === Number(value),
                            );
                            // Prefill with the product's last known cost.
                            if (selected?.cost_price != null) {
                              form.setValue(
                                `items.${index}.cost`,
                                selected.cost_price,
                              );
                            }
                          }}
                        >
                          <SelectTrigger id={`product-${index}`}>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem
                                key={product.id}
                                value={String(product.id)}
                              >
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError>
                      {form.formState.errors.items?.[index]?.product?.message}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`quantity-${index}`}>Qty</FieldLabel>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      {...form.register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                    <FieldError>
                      {form.formState.errors.items?.[index]?.quantity?.message}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`cost-${index}`}>Unit cost</FieldLabel>
                    <Input
                      id={`cost-${index}`}
                      type="number"
                      min="0"
                      step="any"
                      {...form.register(`items.${index}.cost`, {
                        valueAsNumber: true,
                      })}
                    />
                    <FieldError>
                      {form.formState.errors.items?.[index]?.cost?.message}
                    </FieldError>
                  </Field>

                  <div className="flex items-end pb-0.5 sm:pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove item"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              ))}

              {typeof form.formState.errors.items?.message === "string" && (
                <FieldError>{form.formState.errors.items.message}</FieldError>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold">{total.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading}>
                {loading && <Spinner />}
                {loading ? "Saving..." : "Record purchase"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/purchases")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default PurchaseForm;
