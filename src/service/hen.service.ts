import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Hen } from '../model/Hen';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HenService {
  private urlEndPoint: string = 'https://fantastic-engine-jvg57vjg975hv7j-8087.app.github.dev/hen';

  constructor(private http: HttpClient) {}

  update(hen: Hen): Observable<Hen> {
    const url = `${this.urlEndPoint}/update/${hen.id}`;
    return this.http
      .put<Hen>(url, hen)
      .pipe(catchError(this.handleError));
  }
  getHenById(id: number): Observable<any> {
    return this.http.get<any>(`${this.urlEndPoint}/${id}`);
  }
  getHens(): Observable<Hen[]> {
    return this.http
      .get<Hen[]>(this.urlEndPoint)
      .pipe(catchError(this.handleError));
  }

  getInactiveHens(): Observable<Hen[]> {
    const url = `${this.urlEndPoint}/inactivos`;
    return this.http.get<Hen[]>(url).pipe(catchError(this.handleError));
  }

  create(hen: Hen): Observable<Hen> {
    return this.http
      .post<Hen>(`${this.urlEndPoint}`, hen)
      .pipe(catchError(this.handleError));
  }
 // Método para buscar gallinas por fecha
 getHensByDate(arrivalDate: string): Observable<Hen[]> {
  return this.http.get<Hen[]>(`${this.urlEndPoint}/buscar/${arrivalDate}`);
}
  getHen(id: number): Observable<Hen> {
    return this.http
      .get<Hen>(`${this.urlEndPoint}/${id}`)
      .pipe(catchError(this.handleError));
  }

  activate(id: number): Observable<Hen> {
    const url = `${this.urlEndPoint}/activar/${id}`;
    return this.http.put<Hen>(url, {}).pipe(catchError(this.handleError));
  }  

  delete(id: number | null): Observable<void> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }

    // Crear el objeto de datos necesario para el PUT, en caso de que sea necesario
    const data = { status: 'I' }; // Esto depende de la estructura que espera tu backend

    return this.http
      .put<void>(`${this.urlEndPoint}/inactivar/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  deletePhysically(id: number | null): Observable<Hen> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }
    return this.http
      .delete<Hen>(`${this.urlEndPoint}/${id}`)
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
