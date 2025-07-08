export interface Food {
    id_food: number; 
    foodType: string; 
    foodBrand: string; 
    amount: string; 
    packaging: string;
    unitMeasure: string; 
    entryDate: Date; 
    status: string; 
  }
  export interface FoodInsert {
    foodType: string; 
    foodBrand: string; 
    amount: string; 
    packaging: string;
    unitMeasure: string; 
  }
  export interface FoodUpdate {
    id_food: number; 
    foodType: string; 
    foodBrand: string; 
    amount: string; 
    packaging: string;
    unitMeasure: string; 
  }
  
  
