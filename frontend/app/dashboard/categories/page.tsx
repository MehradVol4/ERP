"use client" 

import React, { useEffect, useState } from "react";
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
import axios from "axios";
import axiosInstance from "@/lib/axios";

type data = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};


interface Category  {
  id : number ;
  name : string ;
  description : string ;
  documentId : number ;

}

const Page = () => {

  const [categories,setCategories] = useState([]);
  const [loading,setLoading] = useState(true);
  const [meta,setMeta] = useState(null);
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(5);

  useEffect(function () {
    axiosInstance.get(`/api/categories?pagination[page]=${page}&pagination[pageSize]=${pageSize}`).then((response)=> {
      const apiData = response.data.data.map((item : Category)=>({
        id: item.id,
        name : item.name ,
        description : item.description ,
        documentId : item.documentId , 
      })) ;
      setCategories(apiData) ;
      setMeta(response.data.meta.pagination) ;
    })
    .catch((error) => {
      console.error("Failed to fetch categories:",error) ;
    })
    .finally(()=>setLoading(false)) ;
  },[page,pageSize])

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
          {loading ? <p className="text-muted-foreground">Loading...</p> : <DataTable columns={columns} data={categories} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
