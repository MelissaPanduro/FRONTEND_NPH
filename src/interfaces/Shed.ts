export interface Shed {
    id: number;
    name: string;
    location: string;
    capacity: number;
    chickenType: string;
    inspectionDate: string; // ISO string format
    note: string;
    status: string;
    supplierId: number;
}
  