"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Props {
  onChange: (filters: Record<string, string>) => void;
}

export function UserFilterBar({ onChange }: Props) {
  const [filters, setFilters] = useState({ search: "", loyalty: "", waiter: "" });

  const update = (key: string, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange(next);
  };

  const clear = () => {
    const next = { search: "", loyalty: "", waiter: "" };
    setFilters(next);
    onChange(next);
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Input value={filters.search} onChange={(e) => update("search", e.target.value)} placeholder="Phone, name" />
      <Select value={filters.loyalty} onChange={(e) => update("loyalty", e.target.value)}>
        <option value="">All loyalty levels</option>
        <option value="bronze">Bronze</option>
        <option value="silver">Silver</option>
        <option value="gold">Gold</option>
      </Select>
      <Input value={filters.waiter} onChange={(e) => update("waiter", e.target.value)} placeholder="Waiter ID" />
      <Button variant="outline" onClick={clear}>
        Clear filters
      </Button>
    </div>
  );
}
