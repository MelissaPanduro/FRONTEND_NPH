import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../model/Product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private baseUrl = 'https://congenial-space-disco-76q7x7rr95whvvw-8085.app.github.dev/NPH/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  update(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  softDelete(id: number): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/logic/${id}`, {});
  }

  restore(id: number): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/restore/${id}`, {});
  }
}
