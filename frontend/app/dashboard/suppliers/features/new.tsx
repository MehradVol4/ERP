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
import type { Supplier } from "./columns";

const formSchema = z.object({
  name: z.string().min(1),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type NewProps = {
  item?: Supplier | null;
  onSuccess?: () => void;
  isOpen: boolean;
};

const emptyValues: FormValues = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

function New({ item = null, onSuccess, isOpen }: NewProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      form.reset({
        name: item.name || "",
        contact_person: item.contact_person || "",
        phone: item.phone || "",
        email: item.email || "",
        address: item.address || "",
        notes: item.notes || "",
      });
    } else {
      form.reset(emptyValues);
    }
  }, [item, isOpen, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      if (item?.documentId) {
        await axiosInstance.put(`/api/suppliers/${item.documentId}`, {
          data: values,
        });
        toast.success("Supplier updated!");
      } else {
        await axiosInstance.post("/api/suppliers", { data: values });
        toast.success("Supplier created!");
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to save supplier");
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
          <SheetTitle>{item?.id ? "Edit" : "Add new"} Supplier</SheetTitle>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-6 py-5"
          >
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                placeholder="Supplier name"
                {...form.register("name")}
              />
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="contact_person">Contact person</FieldLabel>
              <Input
                id="contact_person"
                placeholder="Contact person"
                {...form.register("contact_person")}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  placeholder="Phone"
                  {...form.register("phone")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  {...form.register("email")}
                />
                <FieldError>{form.formState.errors.email?.message}</FieldError>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Textarea
                id="address"
                placeholder="Address"
                {...form.register("address")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Notes"
                {...form.register("notes")}
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
