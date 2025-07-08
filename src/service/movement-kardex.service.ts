import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MovementKardex } from '../model/MovementKardex';

@Injectable({
  providedIn: 'root',
})
export class MovementKardexService {
  private apiUrl = 'https://congenial-space-disco-76q7x7rr95whvvw-8085.app.github.dev/NPH/movement-kardex';

  constructor(private http: HttpClient) {}

  getAll(): Observable<MovementKardex[]> {
    return this.http.get<MovementKardex[]>(this.apiUrl);
  }

  getById(kardexId: number): Observable<MovementKardex> {
    return this.http.get<MovementKardex>(`${this.apiUrl}/${kardexId}`);
  }

  create(movementKardex: MovementKardex): Observable<MovementKardex> {
    return this.http.post<MovementKardex>(this.apiUrl, movementKardex);
  }

  update(kardexId: number, movementKardex: MovementKardex): Observable<MovementKardex> {
    return this.http.put<MovementKardex>(`${this.apiUrl}/${kardexId}`, movementKardex);
  }

  delete(kardexId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${kardexId}`);
  }
}
