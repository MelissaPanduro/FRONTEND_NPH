import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubigeo } from '../model/Ubigeo';

@Injectable({
  providedIn: 'root',
})
export class UbigeoService {
  private baseUrl = 'https://congenial-space-disco-76q7x7rr95whvvw-8085.app.github.dev/NPH/ubigeo';

  constructor(private http: HttpClient) {}

  crear(ubigeo: Ubigeo): Observable<Ubigeo> {
    return this.http.post<Ubigeo>(this.baseUrl, ubigeo);
  }

  listarTodos(): Observable<Ubigeo[]> {
    return this.http.get<Ubigeo[]>(this.baseUrl);
  }

  editar(id: number, ubigeo: Ubigeo): Observable<Ubigeo> {
    return this.http.put<Ubigeo>(`${this.baseUrl}/${id}`, ubigeo);
  }

  eliminarFisicamente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/fisico/${id}`);
  }

  eliminarLogico(id: number): Observable<Ubigeo> {
    return this.http.put<Ubigeo>(`${this.baseUrl}/logico/${id}`, {});
  }

  restaurar(id: number): Observable<Ubigeo> {
    return this.http.put<Ubigeo>(`${this.baseUrl}/restaurar/${id}`, {});
  }
}
