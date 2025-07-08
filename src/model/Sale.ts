export interface Sale {
    id: number;
    saleDate: string; 
    name: string;
    ruc: string;
    address: string;
    productId: number;
    weight: number;
    packages: number;
    totalWeight: number;
    pricePerKg: number;
    totalPrice: number;
}
  