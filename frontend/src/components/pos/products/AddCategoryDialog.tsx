"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

type AddCategoryDialogProps = {
  open: boolean;
  categoryName: string;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryNameChange: (name: string) => void;
  onSubmit: () => void;
};

export function AddCategoryDialog({
  open,
  categoryName,
  loading,
  onOpenChange,
  onCategoryNameChange,
  onSubmit,
}: AddCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Add a new category for your products. It will be available only for
            your tenant.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-category-name">Category name</Label>
            <Input
              id="new-category-name"
              value={categoryName}
              onChange={(e) => onCategoryNameChange(e.target.value)}
              placeholder="e.g. Snacks"
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onCategoryNameChange("");
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!categoryName.trim() || loading}
          >
            {loading ? "Adding..." : "Add Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
