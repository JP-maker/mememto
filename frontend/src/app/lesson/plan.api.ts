import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanDay } from './lesson.model';

/** Demande à l'API de répartir le travail jusqu'à la date butoir. */
@Injectable({ providedIn: 'root' })
export class PlanApi {
  private readonly http = inject(HttpClient);

  compute(deadline: string, minutesPerDay: number): Observable<PlanDay[]> {
    return this.http.post<PlanDay[]>('/api/plan', { deadline, minutesPerDay });
  }
}
