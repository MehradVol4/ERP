"use client";

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name_1959017416: z.string().min(1),
  description: z.string().optional(),
});

function New() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(values);
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>,
      );
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <>
      <SheetTrigger />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add a new Category</SheetTitle>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 px-6 py-5"
            >
              <Field>
                <FieldLabel htmlFor="name_1959017416">Name</FieldLabel>
                <Input
                  id="name_1959017416"
                  placeholder="Name of the category"
                  {...form.register("name_1959017416")}
                />

                <FieldError>
                  {form.formState.errors.name_1959017416?.message}
                </FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Category's description"
                  {...form.register("description")}
                />

                <FieldError>
                  {form.formState.errors.description?.message}
                </FieldError>
              </Field>
              <Button type="submit">Submit</Button>
            </form>
        </SheetHeader>
      </SheetContent>
    </>
  );
}

export default New;
