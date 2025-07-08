import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Shed } from '../model/Shed';

@Injectable({
  providedIn: 'root',
})
export class ShedService {
  private baseUrl = 'https://congenial-space-disco-76q7x7rr95whvvw-8085.app.github.dev/NPH/sheds';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Shed[]> {
    return this.http.get<Shed[]>(this.baseUrl);
  }

  getById(id: number): Observable<Shed> {
    return this.http.get<Shed>(`${this.baseUrl}/${id}`);
  }

  create(shed: Shed): Observable<Shed> {
    return this.http.post<Shed>(this.baseUrl, shed);
  }

  update(id: number, shed: Shed): Observable<Shed> {
    return this.http.put<Shed>(`${this.baseUrl}/${id}`, shed);
  }

  delete(id: number): Observable<Shed> {
    return this.http.delete<Shed>(`${this.baseUrl}/logic/${id}`);
  }

  restore(id: number): Observable<Shed> {
    return this.http.put<Shed>(`${this.baseUrl}/restore/${id}`, {});
  }

  permanentDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
