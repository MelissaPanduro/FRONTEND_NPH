import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FoodCost, InsertCost, UpdateCost } from '../model/cost';

@Injectable({
  providedIn: 'root'
})
export class CostFoodService {

  private apiUrl = 'https://msfood-production.up.railway.app/api/food-costs';

  constructor(private http: HttpClient) { }

  getACost(): Observable<FoodCost[]> {
    return this.http.get<FoodCost[]>(`${this.apiUrl}/actives`);
  }

  getICost(): Observable<FoodCost[]> {
    return this.http.get<FoodCost[]>(`${this.apiUrl}/inactives`);
  }

  getFoodCostByWeekNumber(weekNumber: string): Observable<FoodCost[]> {
    return this.http.get<FoodCost[]>(`${this.apiUrl}/search/${weekNumber}`);
  }

  addNewCost(cost: InsertCost): Observable<InsertCost> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<InsertCost>(`${this.apiUrl}`, cost, { headers });
  }

  updateCost(idFoodCosts: number, cost: UpdateCost): Observable<UpdateCost> {
    return this.http.put<UpdateCost>(`${this.apiUrl}/${idFoodCosts}`, cost);
  }

  deleteCost(idFoodCosts: number): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/delete/${idFoodCosts}`, {}, { responseType: 'text' as 'json' });
  }

  reactivateCost(idFoodCosts: number): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/restore/${idFoodCosts}`, {}, { responseType: 'text' as 'json' });
  }
}
