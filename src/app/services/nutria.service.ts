// nutr-ia.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class NutrIaService {
  private apiUrl = 'http://localhost:8000/api';
  private wsUrl = 'ws://localhost:8000/ws';
  private socket$!: WebSocketSubject<any>;

  constructor(private http: HttpClient) { }

  // Método para enviar una evaluación a través de HTTP
  assessPatient(patientInfo: string, image?: File): Observable<any> {
    const formData = new FormData();
    formData.append('patient_info', patientInfo);
    if (image) {
      formData.append('image', image, image.name);
    }

    return this.http.post(`${this.apiUrl}/patient-assessment`, formData);
  }

  // Método para conectar y seguir el proceso en tiempo real vía WebSocket
  connectAssessment(): WebSocketSubject<any> {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = webSocket(this.wsUrl + '/assessment');
    }
    return this.socket$;
  }

  // Iniciar evaluación vía WebSocket
  startWebSocketAssessment(patientInfo: string): void {
    const socket = this.connectAssessment();
    socket.next({ patient_info: patientInfo });
  }

  // Cerrar conexión WebSocket
  closeWebSocketConnection(): void {
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.complete();
    }
  }
}
