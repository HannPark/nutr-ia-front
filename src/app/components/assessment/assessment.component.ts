import { Component} from '@angular/core';
import { NutrIaService } from '../../services/nutria.service';
import { WebSocketSubject } from 'rxjs/webSocket';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-assessment',
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ChatComponent
  ],
  providers: [NutrIaService],
  standalone: true,
  templateUrl: './assessment.component.html',
  styleUrls: ['./assessment.component.css']
})
export class AssessmentComponent {
  patientInfo: string = '';
  selectedFile: File | null = null;
  assessmentResult: any = null;
  loading: boolean = false;
  statusMessages: string[] = [];
  websocketActive: boolean = false;
  socket$: WebSocketSubject<any> | null = null;
  // Propiedades para el chat
  showChat: boolean = false;
  collectedUserData: any = null;

  constructor(private nutriaService: NutrIaService) { }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  // Método para enviar la evaluación mediante HTTP
  startAssessment(): void {
    if (!this.patientInfo) {
      alert('Por favor, ingrese información del paciente');
      return;
    }

    this.loading = true;
    this.statusMessages = ['Iniciando evaluación...'];
    this.nutriaService.assessPatient(this.patientInfo, this.selectedFile || undefined)
      .subscribe({
        next: (result) => {
          this.assessmentResult = result;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error en la evaluación:', error);
          this.statusMessages.push('Error: ' + error.message);
          this.loading = false;
        }
      });
  }

  // Método para iniciar la evaluación con WebSocket para seguimiento en tiempo real
  startRealtimeAssessment(): void {
    if (!this.patientInfo) {
      alert('Por favor, ingrese información del paciente');
      return;
    }

    this.loading = true;
    this.websocketActive = true;
    this.statusMessages = ['Conectando...'];
    this.socket$ = this.nutriaService.connectAssessment();
    this.socket$.subscribe({
      next: (message) => {
        this.statusMessages.push(message.status);
        if (message.data) {
          if (message.status === 'Proceso completado') {
            this.assessmentResult = message.data;
            this.loading = false;
          }
        }
      },
      error: (err) => {
        console.error('Error WebSocket:', err);
        this.statusMessages.push('Error de conexión: ' + err.message);
        this.loading = false;
        this.websocketActive = false;
      },
      complete: () => {
        this.websocketActive = false;
      }
    });

    // Enviar datos iniciales
    this.socket$.next({ patient_info: this.patientInfo });
  }

  // Mostrar interfaz de chat para recopilar información
  startChatAssessment(): void {
    this.showChat = true;
  }

  // Cancelar evaluación y cerrar WebSocket
  cancelAssessment(): void {
    if (this.socket$) {
      this.nutriaService.closeWebSocketConnection();
      this.loading = false;
      this.websocketActive = false;
      this.statusMessages.push('Evaluación cancelada por el usuario');
    }
  }

   // Manejar la finalización del chat con datos recopilados
   handleChatComplete(userData: any): void {
    this.collectedUserData = userData;
    this.showChat = false;

    // Iniciar evaluación con los datos recopilados
    this.loading = true;
    this.statusMessages = ['Procesando evaluación con la información recopilada...'];

    this.nutriaService.assessPatientWithData(userData)
      .subscribe({
        next: (result) => {
          this.assessmentResult = result;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error en la evaluación:', error);
          this.statusMessages.push('Error: ' + error.message);
          this.loading = false;
        }
      });
  }

  // Reiniciar todo el proceso
  resetAssessment(): void {
    this.assessmentResult = null;
    this.showChat = false;
    this.collectedUserData = null;
    this.patientInfo = '';
    this.statusMessages = [];
  }

  ngOnDestroy(): void {
    // Limpiar conexión WebSocket al destruir el componente
    this.nutriaService.closeWebSocketConnection();
  }
}
