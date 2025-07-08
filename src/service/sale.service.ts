import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sale } from '../model/Sale';
@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private apiUrl = 'https://8085-vallegrandeas-msproduct-b053ql2uvak.ws-us118.gitpod.io/sales';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las ventas desde la API.
   */
  getAllSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl);
  }

  /**
   * Obtiene una venta específica por su ID.
   * @param id Identificador de la venta
   */
  getSaleById(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva venta en el backend.
   * @param sale Datos de la venta a crear
   */
  createSale(sale: Sale): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, sale);
  }

  /**
   * Actualiza una venta existente.
   * @param id Identificador de la venta
   * @param sale Datos de la venta actualizados
   */
  updateSale(id: number, sale: Sale): Observable<Sale> {
    return this.http.put<Sale>(`${this.apiUrl}/${id}`, sale);
  }

  /**
   * Elimina una venta del backend.
   * @param id Identificador de la venta a eliminar
   */
  deleteSale(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
