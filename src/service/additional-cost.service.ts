import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdditionalCost } from '../model/AdditionalCost'; // Asegúrate de tener esta interfaz

@Injectable({
  providedIn: 'root'
})
export class AdditionalCostService {

  private apiUrl = 'https://8086-dannalopezb-backendprs-3g7oxl5ax83.ws-us118.gitpod.io/additional-cost'; // URL de la API

  constructor(private http: HttpClient) {}

  // Obtener todos los costos adicionales
  getAll(): Observable<AdditionalCost[]> {
    return this.http.get<AdditionalCost[]>(this.apiUrl);
  }

  // Obtener un costo adicional por ID
  getById(id: number): Observable<AdditionalCost> {
    return this.http.get<AdditionalCost>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo costo adicional
  create(cost: AdditionalCost): Observable<AdditionalCost> {
    return this.http.post<AdditionalCost>(this.apiUrl, cost);
  }

  // Actualizar un costo adicional
  update(id: number, cost: AdditionalCost): Observable<AdditionalCost> {
    return this.http.put<AdditionalCost>(`${this.apiUrl}/${id}`, cost);
  }

  // Eliminar un costo adicional
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
