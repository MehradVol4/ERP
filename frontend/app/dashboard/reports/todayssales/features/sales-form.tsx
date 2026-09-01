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
import type { Product } from "../../../products/features/columns";

const lineItemSchema = z.object({
  product: z.number().min(1, "Select a product"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price can't be negative"),
});

const formSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  date: z.string().min(1, "Date is required"),
  products: z.array(lineItemSchema).min(1, "Add at least one item"),
});

type FormValues = z.infer<typeof formSchema>;

export type SaleFormValues = {
  documentId: string;
  customer_name: string;
  date: string;
  products: { product: number; quantity: number; price: number }[];
};

const emptyItem = { product: 0, quantity: 1, price: 0 };

const toDateTimeLocal = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

type SalesFormProps = {
  /** When provided, the form edits this invoice; otherwise it creates a new one. */
  sale?: SaleFormValues | null;
};

function SalesForm({ sale = null }: SalesFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const isEdit = Boolean(sale?.documentId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: sale?.customer_name ?? "",
      date: sale ? toDateTimeLocal(sale.date) : toDateTimeLocal(new Date().toISOString()),
      products:
        sale && sale.products.length > 0
          ? sale.products.map((item) => ({ ...item }))
          : [{ ...emptyItem }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  // Load products for the line-item dropdown.
  useEffect(() => {
    let active = true;
    axiosInstance
      .get("/api/products?pagination[pageSize]=100")
      .then((response) => {
        if (!active) return;
        const rows: Product[] = response.data.data.map((item: Product) => ({
          id: item.id,
          documentId: item.documentId,
          name: item.name,
          price: item.price,
          stock: item.stock,
          barcode: item.barcode,
          description: item.description,
        }));
        setProducts(rows);
      })
      .catch((error) => {
        console.error("Failed to fetch products:", error);
      });
    return () => {
      active = false;
    };
  }, []);

  const watchedItems = form.watch("products");
  const total = (watchedItems ?? []).reduce(
    (sum, item) =>
      sum + (Number(item?.quantity) || 0) * (Number(item?.price) || 0),
    0,
  );

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const payload = {
        data: {
          customer_name: values.customer_name,
          date: new Date(values.date).toISOString(),
          total,
          products: values.products.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      };

      if (isEdit && sale) {
        await axiosInstance.put(`/api/sales/${sale.documentId}`, payload);
        toast.success("Invoice updated!");
      } else {
        await axiosInstance.post("/api/sales", payload);
        toast.success("Invoice created!");
      }
      router.push("/dashboard/sales");
    } catch (error) {
      toast.error(isEdit ? "Failed to update invoice" : "Failed to create invoice");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Invoice" : "New Invoice"}</CardTitle>
          <CardDescription>
            <span>
              {isEdit
                ? "Update an existing sales invoice"
                : "Create a new sales invoice"}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="customer_name">Customer name</FieldLabel>
                <Input
                  id="customer_name"
                  placeholder="Customer name"
                  {...form.register("customer_name")}
                />
                <FieldError>
                  {form.formState.errors.customer_name?.message}
                </FieldError>
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
                      name={`products.${index}.product`}
                      render={({ field }) => (
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => {
                            field.onChange(Number(value));
                            const selected = products.find(
                              (p) => p.id === Number(value),
                            );
                            if (selected) {
                              form.setValue(
                                `products.${index}.price`,
                                selected.price ?? 0,
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
                      {form.formState.errors.products?.[index]?.product?.message}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`quantity-${index}`}>Qty</FieldLabel>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      {...form.register(`products.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                    <FieldError>
                      {
                        form.formState.errors.products?.[index]?.quantity
                          ?.message
                      }
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`price-${index}`}>Price</FieldLabel>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      min="0"
                      step="any"
                      {...form.register(`products.${index}.price`, {
                        valueAsNumber: true,
                      })}
                    />
                    <FieldError>
                      {form.formState.errors.products?.[index]?.price?.message}
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

              {typeof form.formState.errors.products?.message === "string" && (
                <FieldError>{form.formState.errors.products.message}</FieldError>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold">{total.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading}>
                {loading && <Spinner />}
                {loading
                  ? "Saving..."
                  : isEdit
                    ? "Save changes"
                    : "Create invoice"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/sales")}
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

export default SalesForm;
