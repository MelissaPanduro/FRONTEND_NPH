import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EggProduction } from '../model/EggProduction'; // Asegúrate de tener esta interfaz

@Injectable({
  providedIn: 'root'
})
export class EggProductionService {
  private apiUrl = 'https://8086-dannalopezb-backendprs-3g7oxl5ax83.ws-us118.gitpod.io/egg-production';

  constructor(private http: HttpClient) {}

  getAll(): Observable<EggProduction[]> {
    return this.http.get<EggProduction[]>(this.apiUrl);
  }

  getById(id: number): Observable<EggProduction> {
    return this.http.get<EggProduction>(`${this.apiUrl}/${id}`);
  }

  create(data: EggProduction): Observable<EggProduction> {
    return this.http.post<EggProduction>(this.apiUrl, data);
  }

  update(id: number, data: EggProduction): Observable<EggProduction> {
    return this.http.put<EggProduction>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
