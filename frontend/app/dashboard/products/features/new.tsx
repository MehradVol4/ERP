"use client";

import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import axiosInstance from "@/lib/axios";
import type { Product, Supplier } from "./columns";

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().optional(),
  cost_price: z.number().optional(),
  stock: z.number().optional(),
  reorder_level: z.number().optional(),
  // Empty string = no supplier selected.
  supplier: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type NewProps = {
  item?: Product | null;
  onSuccess?: () => void;
  isOpen: boolean;
};

const emptyValues: FormValues = {
  name: "",
  description: "",
  price: 0,
  cost_price: 0,
  stock: 0,
  reorder_level: 10,
  supplier: "",
};

function New({ item = null, onSuccess, isOpen }: NewProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
  });

  // Load suppliers for the picker whenever the sheet opens.
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    axiosInstance
      .get("/api/suppliers?pagination[pageSize]=100&fields[0]=name")
      .then((response) => {
        if (!active) return;
        const rows: Supplier[] = response.data.data.map((s: Supplier) => ({
          id: s.id,
          documentId: s.documentId,
          name: s.name,
        }));
        setSuppliers(rows);
      })
      .catch((error) => console.error("Failed to fetch suppliers:", error));
    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      form.reset({
        name: item.name || "",
        description: item.description || "",
        price: item.price || 0,
        cost_price: item.cost_price || 0,
        stock: item.stock || 0,
        reorder_level: item.reorder_level ?? 10,
        supplier: item.supplier?.id ? String(item.supplier.id) : "",
      });
    } else {
      form.reset(emptyValues);
    }
  }, [item, isOpen, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const payload = {
        data: {
          name: values.name,
          description: values.description,
          price: values.price,
          cost_price: values.cost_price,
          stock: values.stock,
          reorder_level: values.reorder_level,
          // Strapi relation: set to the chosen id, or null to clear it.
          supplier: values.supplier ? Number(values.supplier) : null,
        },
      };

      if (item?.documentId) {
        await axiosInstance.put(`/api/products/${item.documentId}`, payload);
        toast.success("Product updated!");
      } else {
        await axiosInstance.post("/api/products", payload);
        toast.success("Product created!");
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to save product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    //@ts-ignore
    <>
      <SheetTrigger />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{item?.id ? "Edit" : "Add new"} Product</SheetTitle>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-6 py-5"
          >
            <Field>
              <FieldLabel htmlFor="name_1959017416">Name</FieldLabel>
              <Input
                id="name_1959017416"
                placeholder="Name of the Product"
                {...form.register("name")}
              />

              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="Product's description"
                {...form.register("description")}
              />

              <FieldError>
                {form.formState.errors.description?.message}
              </FieldError>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="price">Sell price</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  step="any"
                  placeholder="Sell price"
                  {...form.register("price", { valueAsNumber: true })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="cost_price">Cost price</FieldLabel>
                <Input
                  id="cost_price"
                  type="number"
                  step="any"
                  placeholder="Cost price"
                  {...form.register("cost_price", { valueAsNumber: true })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="stock">Stock</FieldLabel>
                <Input
                  id="stock"
                  type="number"
                  step="1"
                  placeholder="Product stock"
                  {...form.register("stock", { valueAsNumber: true })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reorder_level">Reorder level</FieldLabel>
                <Input
                  id="reorder_level"
                  type="number"
                  step="1"
                  placeholder="Low-stock threshold"
                  {...form.register("reorder_level", { valueAsNumber: true })}
                />
              </Field>
            </div>
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
            <Button type="submit" disabled={loading}>
              {loading && <Spinner />}
              {loading ? "Saving" : "Save changes"}
            </Button>
          </form>
        </SheetHeader>
      </SheetContent>
    </>
  );
}

export default New;
