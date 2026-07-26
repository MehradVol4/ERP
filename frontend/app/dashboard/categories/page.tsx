import React from "react";
import { DataTable } from "./features/data-table";
import { columns } from "./features/columns";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type data = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const data: data[] = [
  {
    id: "728ed52f",
    amount: 100,
    status: "pending",
    email: "john.doe@gmail.com",
  },
  {
    id: "4789ehu",
    amount: 200,
    status: "processing",
    email: "jack.nic@gmail.com",
  },
];

const Page = () => {
  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            <span>List of categories</span>
          </CardDescription>
          <CardAction>
            <Button>Add new record</Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
