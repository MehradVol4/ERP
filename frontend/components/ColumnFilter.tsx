"use client";

type ColumnFilterProps = {
  columnLabel?: string;
  columnValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { FilterX, Funnel } from "lucide-react";

const ColumnFilter: React.FC<ColumnFilterProps> = ({
  columnLabel,
  columnValue,
  onChange,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState(columnValue || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInputValue(columnValue || "");
  }, [columnValue]);

  const handleApply = () => {
    onChange?.(inputValue);
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.("");
    setInputValue("");
  };

  return (
    <div className="flex items-center gap-1">
      {columnLabel}
      {columnValue ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-1 text-primary"
          onClick={handleClear}
        >
          <FilterX className="h-4 w-4" />
        </Button>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="icon" className="h-6 w-6 p-1" />
            }
          >
            <Funnel className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent>
            <Input
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleApply} size="sm" className="w-full">
                Apply
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default ColumnFilter;
