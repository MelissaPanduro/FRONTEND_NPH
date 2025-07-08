import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TypeKardex } from '../model/TypeKardex';

@Injectable({
  providedIn: 'root',
})
export class TypeKardexService {
  private baseUrl = 'https://congenial-space-disco-76q7x7rr95whvvw-8085.app.github.dev/NPH/type-kardex';

  constructor(private http: HttpClient) {}

  listAll(): Observable<TypeKardex[]> {
    return this.http.get<TypeKardex[]>(`${this.baseUrl}/list-all`);
  }

  listActive(): Observable<TypeKardex[]> {
    return this.http.get<TypeKardex[]>(`${this.baseUrl}/list`);
  }

  create(typeKardex: TypeKardex): Observable<TypeKardex> {
    return this.http.post<TypeKardex>(`${this.baseUrl}/create`, typeKardex);
  }

  update(id: number, typeKardex: TypeKardex): Observable<TypeKardex> {
    return this.http.put<TypeKardex>(`${this.baseUrl}/edit/${id}`, typeKardex);
  }

  deleteLogical(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/deleteLogical/${id}`, {});
  }

  deletePhysical(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deletePhysical/${id}`);
  }

  restore(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/restore/${id}`, {});
  }
}
