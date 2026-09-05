"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@/src/hooks/useAuth";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { apiService } from "@/src/services/ApiService";
import {
  Product,
  POSTransactionCreate,
  POSPaymentMethod,
  POSShift,
  POSShiftStatus,
} from "@/src/models/pos";
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Receipt,
  Package,
} from "lucide-react";
import { DashboardLayout } from "../../../components/layout";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { toast } from "sonner";

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

const POSSale = () => {
  const { canCreate } = useCrudPermissions("pos:sale");
  const {} = useAuth();
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<POSPaymentMethod>(POSPaymentMethod.CASH);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const hasOpenShift = async () => {
    try {
      const response = await apiService.get("/pos/shifts");
      const shifts: POSShift[] = response.shifts || [];
      return shifts.some((shift) => shift.status === POSShiftStatus.OPEN);
    } catch {
      return false;
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiService.get("/pos/products");
      setProducts(response.products || []);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to load products";
      toast.error(`Load Error: ${errorMessage}`);
    }
  };

  const searchProducts = async (query: string) => {
    if (query.length < 2) return;

    try {
      const response = await apiService.get(`/pos/products/search?q=${query}`);
      setProducts(response.products || []);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to search products";
      toast.error(`Search Error: ${errorMessage}`);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * product.salePrice,
              }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          total: product.salePrice,
        },
      ]);
    }

    setSearchTerm("");
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.product.salePrice,
            }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setNotes("");
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const getTotal = () => {
    return getSubtotal();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const openShift = await hasOpenShift();
      if (!openShift) {
        toast.warning("No open shift found. Please open a shift first.");
        router.push("/pos/shifts");
        return;
      }

      const transactionData: POSTransactionCreate = {
        customerName: customerName || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: item.product.salePrice,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: item.total,
        })),
        taxRate: 0,
        discount: 0,
        paymentMethod: selectedPaymentMethod,
        notes: notes || undefined,
      };

      await apiService.post("/pos/transactions", transactionData);

      // Clear cart and show success
      clearCart();
      toast.success("Transaction completed successfully!");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create transaction";
      if (String(errorMessage).toLowerCase().includes("no open shift")) {
        toast.warning("No open shift found. Please open a shift first.");
        router.push("/pos/shifts");
        return;
      }
      toast.error(`Transaction Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Sale</h1>
            <p className="text-muted-foreground">
              Create a new point of sale transaction
            </p>
          </div>

          {canCreate() && (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push("/pos/products?openAdd=true")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search and Cart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Products
                </CardTitle>
                <CardDescription>
                  Search by product name, SKU, or barcode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchProducts(e.target.value);
                      }}
                      className="pl-10"
                    />
                  </div>

                  {searchTerm && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => addToCart(product)}
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              SKU: {product.sku} | Stock:{" "}
                              {product.stockQuantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(product.salePrice)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart ({cart.length} items)
                </CardTitle>
                <CardDescription>Review items before checkout</CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      No items in cart
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Search and add products to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.product.salePrice)} each
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>

                          <div className="text-right ml-4">
                            <p className="font-semibold">
                              {formatCurrency(item.total)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Checkout Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Checkout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Information */}
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name (Optional)</Label>
                  <Input
                    id="customerName"
                    placeholder="Walk-in customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={selectedPaymentMethod}
                    onValueChange={(value: string) =>
                      setSelectedPaymentMethod(value as POSPaymentMethod)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(POSPaymentMethod).map((method) => (
                        <SelectItem key={method} value={method}>
                          <div className="flex items-center space-x-2">
                            {method === POSPaymentMethod.CASH ? (
                              <ShoppingCart className="h-4 w-4" />
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                            <span>{method.replace("_", " ")}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Transaction notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(getSubtotal())}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(getTotal())}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {canCreate() && (
                    <Button
                      onClick={handleCheckout}
                      disabled={cart.length === 0 || loading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {loading ? "Processing..." : "Complete Sale"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="w-full"
                  >
                    Clear Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default POSSale;
