import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { CicloVida } from '../model/Lifecycle';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CicloVidaService {
  private urlEndPoint: string = 'http://localhost:8087/cicloVida';

  constructor(private http: HttpClient) {}
  // Método para obtener ciclos por typeIto (Vacunas, Alimentos, etc.)
  getCiclosByTypeIto(typeIto: string): Observable<CicloVida[]> {
    const url = `${this.urlEndPoint}/type/${typeIto}`;
    return this.http
      .get<CicloVida[]>(url)
      .pipe(catchError(this.handleError));  // Manejo de errores
  }

  update(cicloVida: CicloVida): Observable<CicloVida> {
    const url = `${this.urlEndPoint}/update/${cicloVida.id}`;
    return this.http
      .put<CicloVida>(url, cicloVida)
      .pipe(catchError(this.handleError));
  }

  getCycles(): Observable<CicloVida[]> {
    return this.http
      .get<CicloVida[]>(this.urlEndPoint)
      .pipe(catchError(this.handleError));
  }

  getInactiveCycles(): Observable<CicloVida[]> {
    const url = `${this.urlEndPoint}/inactivos`;
    return this.http.get<CicloVida[]>(url).pipe(catchError(this.handleError));
  }

  create(cicloVida: CicloVida): Observable<CicloVida> {
    return this.http
      .post<CicloVida>(`${this.urlEndPoint}`, cicloVida)
      .pipe(catchError(this.handleError));
  }

  getCycle(id: number): Observable<CicloVida> {
    return this.http
      .get<CicloVida>(`${this.urlEndPoint}/${id}`)
      .pipe(catchError(this.handleError));
  }

  activate(id: number): Observable<CicloVida> {
    const url = `${this.urlEndPoint}/activar/${id}`;
    return this.http.put<CicloVida>(url, {}).pipe(catchError(this.handleError));
  }  

  delete(id: number | null): Observable<void> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }

    // Crear el objeto de datos necesario para el PUT, en caso de que sea necesario
    const data = { status: 'I' }; // Esto depende de la estructura que espera el backend

    return this.http
      .put<void>(`${this.urlEndPoint}/inactivar/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  deletePhysically(id: number | null): Observable<CicloVida> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }
    return this.http
      .delete<CicloVida>(`${this.urlEndPoint}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('Error al hacer la solicitud', error);
    if (error.status === 0) {
      return throwError('No se puede conectar al servidor');
    } else {
      return throwError(
        error.error?.message || 'Ocurrió un error, por favor intente de nuevo'
      );
    }
  }
}