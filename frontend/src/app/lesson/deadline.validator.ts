import { ValidatorFn } from '@angular/forms';
import { MAX_DAYS, daysUntil } from './dates';

/** La date butoir doit tomber entre demain et dans un an. */
export const deadlineValidator: ValidatorFn = (control) => {
  const value = control.value as string;
  if (!value) {
    return null; // « obligatoire » est géré par Validators.required
  }
  const days = daysUntil(value);
  return days < 1 || days > MAX_DAYS ? { deadline: true } : null;
};
