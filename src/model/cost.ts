export interface FoodCost {
    idFoodCosts: number;
    weekNumber: string;
    foodType: string;
    gramsPerChicken: string;
    totalKg: string;
    totalCost: string;
    startDate: Date;
    endDate: Date;
    status: string;
}

export interface EditableFoodCost extends FoodCost {
    unitPrice?: string;
}


export interface InsertCost {
    weekNumber: string;
    foodType: string;
    gramsPerChicken: string;
    unitPrice: string;
}

export interface UpdateCost {
    idFoodCosts: number;
    weekNumber: string;
    foodType: string;
    gramsPerChicken: string;
    unitPrice: string;
}
