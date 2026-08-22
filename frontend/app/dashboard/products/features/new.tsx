"use client";

import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner"; 
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import axiosInstance from "@/lib/axios";
import type { Product } from "./columns";

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().optional(),

});

type NewProps = {
  item?: Product | null;
  onSuccess?: () => void;
  isOpen: boolean;
};

function New({ item = null, onSuccess, isOpen }: NewProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price:0,
      stock:0,
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      form.reset({
        name: item.name || "",
        description: item.description || "",
        price: item.price || 0,
        stock: item.stock || 0,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        stock: 0,
      });
    }
  }, [item, isOpen, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      if (item?.documentId) {
        await axiosInstance.put(`/api/products/${item.documentId}`, {
          data: values,
        });
        toast.success("Product updated!");
      } else {
        await axiosInstance.post("/api/products", { data: values });
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
            className="space-y-8 px-6 py-5"
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
            <Field>
              <FieldLabel htmlFor="price">Price</FieldLabel>
              <Input
                id="price"
                type="number"
                step="any"
                placeholder="Product Price"
                {...form.register("price", { valueAsNumber: true })}
               />
            </Field>
            <Field>
              <FieldLabel htmlFor="stock">Stock</FieldLabel>
              <Input
              id="stock"
              type="number"
              step="any"
              placeholder="Product stock"
              {...form.register("stock", { valueAsNumber: true })}
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
