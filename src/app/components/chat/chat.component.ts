// chat.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, takeUntil } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  sender: 'user' | 'bot' | 'system';
  message: string;
  data?: any;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;

  // Evento para comunicar que se completó la recopilación de datos
  @Output() assessmentComplete = new EventEmitter<any>();

  messages: ChatMessage[] = [];
  userMessage = '';
  socket$: WebSocketSubject<any> | null = null;
  private destroy$ = new Subject<void>();
  isConnected = false;
  isComplete = false;
  clientId = '';
  userData: any = null;

  constructor() { }

  ngOnInit(): void {
    this.clientId = uuidv4();
    this.connectWebSocket();
  }

  connectWebSocket(): void {
    if (this.socket$) {
      this.socket$.complete();
    }

    // Ajusta la URL según la configuración de tu backend
    this.socket$ = webSocket(`ws://localhost:8000/ws/chat/${this.clientId}`);

    this.socket$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Procesar mensajes recibidos del WebSocket
          const message: ChatMessage = {
            sender: response.sender,
            message: response.message,
            timestamp: new Date()
          };

          // Si se reciben datos completos
          if (response.data) {
            message.data = response.data;
            this.userData = response.data;
            this.isComplete = true;
          }

          this.messages.push(message);
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (err) => {
          console.error('Error en el WebSocket:', err);
          this.messages.push({
            sender: 'system',
            message: 'Error de conexión. Intenta recargar la página.',
            timestamp: new Date()
          });
          this.isConnected = false;
        },
        complete: () => {
          this.isConnected = false;
          console.log('Conexión WebSocket cerrada');
        }
      });

    this.isConnected = true;
  }

  sendMessage(): void {
    if (!this.userMessage.trim() || !this.socket$ || !this.isConnected) {
      return;
    }

    // Añadir mensaje del usuario al chat
    this.messages.push({
      sender: 'user',
      message: this.userMessage,
      timestamp: new Date()
    });

    // Enviar mensaje al WebSocket
    this.socket$.next({ message: this.userMessage });

    // Limpiar el campo de entrada
    this.userMessage = '';

    // Desplazar hacia abajo
    setTimeout(() => this.scrollToBottom(), 100);
  }

  scrollToBottom(): void {
    try {
      const element = this.chatMessagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Error al desplazar:', err);
    }
  }

  startAssessmentWithData(): void {
    // Emitir evento con los datos recopilados
    this.assessmentComplete.emit(this.userData);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.socket$) {
      this.socket$.complete();
    }
  }
}
