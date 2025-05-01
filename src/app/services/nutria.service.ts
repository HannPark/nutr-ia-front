// nutria.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class NutrIaService {
  private apiUrl = 'http://localhost:8000/api';
  private wsUrl = 'ws://localhost:8000/ws';
  private socket$: WebSocketSubject<any> | null = null;

  constructor(private http: HttpClient) {}

  // Método para evaluar al paciente con el endpoint tradicional
  assessPatient(patientInfo: string, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('patient_info', patientInfo);

    if (file) {
      formData.append('file', file);
    }

    return this.http.post(`${this.apiUrl}/assessment`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Conexión WebSocket para evaluación en tiempo real
  assessPatientWithData(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/assessment-with-data`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Conexión WebSocket para evaluación en tiempo real
  connectAssessment(): WebSocketSubject<any> {
    this.closeWebSocketConnection();
    this.socket$ = webSocket(`${this.wsUrl}/assessment`);
    return this.socket$;
  }

  // Conexión WebSocket para chat interactivo
  connectChat(clientId: string): WebSocketSubject<any> {
    this.closeWebSocketConnection();
    this.socket$ = webSocket(`${this.wsUrl}/chat/${clientId}`);
    return this.socket$;
  }

  // Cerrar conexión WebSocket
  closeWebSocketConnection(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }

  // Manejar errores HTTP
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error en la solicitud.';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}, mensaje: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
