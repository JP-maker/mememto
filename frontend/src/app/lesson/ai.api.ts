import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PreparedItem } from './lesson.model';

export type AiProvider = 'ANTHROPIC' | 'OPENAI';

/**
 * Demande au serveur de préparer le texte avec l'IA de l'utilisateur.
 * La clé n'est envoyée que dans cette requête : elle n'est ni stockée ni gardée dans le composant.
 */
@Injectable({ providedIn: 'root' })
export class AiApi {
  private readonly http = inject(HttpClient);

  prepare(provider: AiProvider, apiKey: string, text: string): Observable<PreparedItem[]> {
    return this.http.post<PreparedItem[]>('/api/prepare', { provider, apiKey, text });
  }
}
