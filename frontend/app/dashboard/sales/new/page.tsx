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
import axiosInstance from "@/lib/axios";
import type { Product } from "../../products/features/columns";

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

const emptyItem = { product: 0, quantity: 1, price: 0 };

const Page = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: "",
      date: new Date().toISOString().slice(0, 16),
      products: [{ ...emptyItem }],
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
      await axiosInstance.post("/api/sales", {
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
      });
      toast.success("Invoice created!");
      router.push("/dashboard/sales");
    } catch (error) {
      toast.error("Failed to create invoice");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>New Invoice</CardTitle>
          <CardDescription>
            <span>Create a new sales invoice</span>
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
                {loading ? "Saving..." : "Create invoice"}
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
};

export default Page;
