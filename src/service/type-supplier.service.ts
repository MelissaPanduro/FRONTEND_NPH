import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TypeSupplier } from '../model/TypeSupplier';

@Injectable({
  providedIn: 'root',
})
export class TypeSupplierService {
  private baseUrl = 'https://congenial-space-disco-76q7x7rr95whvvw-8085.app.github.dev/NPH/type-suppliers';

  constructor(private http: HttpClient) {}

  getAll(): Observable<TypeSupplier[]> {
    return this.http.get<TypeSupplier[]>(this.baseUrl);
  }

  getById(id: number): Observable<TypeSupplier> {
    return this.http.get<TypeSupplier>(`${this.baseUrl}/${id}`);
  }

  create(typeSupplier: TypeSupplier): Observable<TypeSupplier> {
    return this.http.post<TypeSupplier>(this.baseUrl, typeSupplier);
  }

  update(id: number, typeSupplier: TypeSupplier): Observable<TypeSupplier> {
    return this.http.put<TypeSupplier>(`${this.baseUrl}/${id}`, typeSupplier);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  softDelete(id: number): Observable<TypeSupplier> {
    return this.http.put<TypeSupplier>(`${this.baseUrl}/logico/${id}`, {});
  }

  restore(id: number): Observable<TypeSupplier> {
    return this.http.put<TypeSupplier>(`${this.baseUrl}/restaurar/${id}`, {});
  }
}
