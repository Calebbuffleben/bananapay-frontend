import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiItem, PlatformService } from '../../core/platform.service';
import { apiErrorMessage } from '../../shared/api-error';

@Component({
  selector: 'app-public-quiz',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="quiz">
      <p class="brand-mark compact"><span class="nana">nana</span><span class="pay">pay</span></p>
      @if(loading()){<p class="muted">Carregando quiz...</p>}
      @else if(completed()){
        <div class="stage"><p class="eyebrow">Concluído</p><h1>Obrigado, {{ lead.name }}!</h1><p class="muted">Suas respostas foram recebidas.</p>@if(quiz()['product']?.slug){<a class="btn" [routerLink]="['/p', quiz()['product'].slug]">Conhecer a oferta</a>}</div>
      } @else {
        <div class="stage"><p class="eyebrow">Quiz interativo</p><h1>{{ quiz()['title'] }}</h1>
          <p class="progress">Etapa {{ Math.min(stepIndex() + 1, steps().length + 1) }} de {{ steps().length + 1 }}</p>
          @if(error()){<p class="error">{{ error() }}</p>}
          @if(currentStep(); as step){
            <section class="step">
              <h2>{{ step.title }}</h2>
              @if(step.type === 'SINGLE_CHOICE'){
                <div class="choices">@for(option of step.config?.options || []; track option){<button type="button" (click)="choose(step, option)">{{ option }}</button>}</div>
              } @else {
                <label class="field"><input [(ngModel)]="answers[step.id]" [placeholder]="step.config?.placeholder || 'Sua resposta'"></label>
                <button class="btn" type="button" (click)="next()">Continuar</button>
              }
            </section>
          } @else {
            <hr>
            <label class="field">Nome<input [(ngModel)]="lead.name" autocomplete="name"></label>
            <label class="field">E-mail<input type="email" [(ngModel)]="lead.email" autocomplete="email"></label>
            <label class="field">WhatsApp<input [(ngModel)]="lead.phone" autocomplete="tel"></label>
            <label class="consent"><input type="checkbox" [(ngModel)]="lead.whatsappOptIn"> Aceito receber mensagens relacionadas a este quiz.</label>
            <button class="btn" (click)="submit()">Concluir</button>
          }
        </div>
      }
    </main>
  `,
  styles: `
    .quiz {
      max-width: 720px;
      margin: 0 auto;
      padding:
        max(clamp(20px, 5vw, 48px), env(safe-area-inset-top, 0px))
        max(16px, env(safe-area-inset-right, 0px))
        max(64px, env(safe-area-inset-bottom, 0px))
        max(16px, env(safe-area-inset-left, 0px));
      min-height: 100dvh;
      width: 100%;
      min-width: 0;
    }
    .brand-mark.compact { margin: 0 0 28px; font-size: clamp(1.8rem, 5vw, 2.3rem); animation: bp-brand 0.55s var(--bp-ease) both; }
    .stage { animation: bp-rise 0.55s var(--bp-ease) both; }
    h1 { font-size: clamp(28px, 6vw, 48px); margin: 8px 0 20px; line-height: 1.05; }
    .field { margin-bottom: 16px; }
    hr { border: 0; border-top: 1px solid var(--bp-ink-line); margin: 28px 0; }
    .btn { width: 100%; margin-top: 8px; }
    .progress { color: var(--bp-cream-muted); font-size: 13px; letter-spacing: 0.04em; }
    .step h2 { font-size: clamp(1.3rem, 3vw, 1.7rem); margin: 28px 0 18px; }
    .choices { display: grid; gap: 10px; }
    .choices button {
      border: 1px solid var(--bp-ink-line);
      background: var(--bp-ink-elevated);
      color: var(--bp-cream);
      padding: 14px 16px;
      text-align: left;
      cursor: pointer;
      border-radius: 10px;
      font-weight: 600;
      transition: border-color 0.18s var(--bp-ease), background 0.18s var(--bp-ease), transform 0.18s var(--bp-ease);
    }
    .choices button:hover {
      border-color: var(--bp-banana);
      background: var(--bp-banana-glow);
      color: var(--bp-banana);
      transform: translateX(3px);
    }
    .consent { display: flex; gap: 10px; align-items: flex-start; color: var(--bp-cream-muted); font-size: 0.92rem; margin-bottom: 12px; }
    .choices button { min-height: 48px; width: 100%; }

    @media (max-width: 480px) {
      .choices button:hover { transform: none; }
      .consent { font-size: 0.85rem; }
    }
  `,
})
export class PublicQuizComponent implements OnInit {
  readonly quiz = signal<ApiItem>({});
  readonly loading = signal(true);
  readonly error = signal('');
  readonly completed = signal(false);
  readonly stepIndex = signal(0);
  readonly Math = Math;
  answers: Record<string, string> = {};
  lead = { name: '', email: '', phone: '', whatsappOptIn: false };
  private slug = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly platform: PlatformService,
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.platform.publicQuiz(this.slug).subscribe({
      next: (quiz) => { this.quiz.set(quiz); this.loading.set(false); },
      error: (error) => { this.error.set(apiErrorMessage(error, 'Quiz não encontrado')); this.loading.set(false); },
    });
  }

  steps() { return this.quiz()['steps'] || []; }
  currentStep() { return this.steps()[this.stepIndex()] ?? null; }

  next() {
    const step = this.currentStep();
    if (!step || !String(this.answers[step.id] || '').trim()) {
      this.error.set('Responda antes de continuar');
      return;
    }
    this.error.set('');
    this.goForward(step);
  }

  choose(step: ApiItem, option: string) {
    this.answers[step.id] = option;
    this.error.set('');
    this.goForward(step);
  }

  private goForward(step: ApiItem) {
    const nextStepId = step.config?.nextStepId;
    if (nextStepId) {
      const nextIndex = this.steps().findIndex((candidate: ApiItem) => candidate.id === nextStepId);
      if (nextIndex >= 0) {
        this.stepIndex.set(nextIndex);
        return;
      }
    }
    this.stepIndex.update((index) => index + 1);
  }

  submit() {
    if (!this.lead.name.trim() || !this.lead.email.trim()) {
      this.error.set('Informe seu nome e e-mail');
      return;
    }
    this.platform.submitQuizLead(this.slug, { ...this.lead, answers: this.answers }).subscribe({
      next: () => this.completed.set(true),
      error: (error) => this.error.set(apiErrorMessage(error, 'Não foi possível enviar suas respostas')),
    });
  }
}
