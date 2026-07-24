import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

// API projections vary by section and are rendered by data-driven workspaces.
export type ApiItem = any;

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  features() {
    return this.http.get<Record<string, boolean>>(`${this.api}/features`);
  }

  dashboard(params: Record<string, string> = {}) {
    return this.http.get<ApiItem>(`${this.api}/analytics/dashboard`, {
      params: this.params(params),
    });
  }

  sales(params: Record<string, string> = {}) {
    return this.http.get<ApiItem>(`${this.api}/sales`, {
      params: this.params(params),
    });
  }

  fees() {
    return this.http.get<ApiItem[]>(`${this.api}/finance/fees`);
  }

  balance() {
    return this.http.get<ApiItem>(`${this.api}/finance/balance`);
  }

  withdrawals() {
    return this.http.get<ApiItem[]>(`${this.api}/finance/withdrawals`);
  }

  requestWithdrawal(payload: { amountCents: number; pixKey: string }) {
    return this.http.post<ApiItem>(
      `${this.api}/finance/withdrawals`,
      payload,
    );
  }

  subscriptionMetrics() {
    return this.http.get<ApiItem>(`${this.api}/subscriptions/metrics`);
  }

  subscriptions() {
    return this.http.get<ApiItem[]>(`${this.api}/subscriptions`);
  }

  plans() {
    return this.http.get<ApiItem[]>(`${this.api}/subscriptions/plans`);
  }

  createPlan(payload: ApiItem) {
    return this.http.post<ApiItem>(`${this.api}/subscriptions/plans`, payload);
  }

  cancelSubscription(id: string) {
    return this.http.post<ApiItem>(
      `${this.api}/subscriptions/${id}/cancel`,
      {},
    );
  }

  buyerSubscriptions() {
    return this.http.get<ApiItem[]>(`${this.api}/buyer/subscriptions`);
  }

  cancelBuyerSubscription(id: string) {
    return this.http.post<ApiItem>(
      `${this.api}/buyer/subscriptions/${id}/cancel`,
      {},
    );
  }

  quizzes() {
    return this.http.get<ApiItem[]>(`${this.api}/quizzes`);
  }

  createQuiz(payload: ApiItem) {
    return this.http.post<ApiItem>(`${this.api}/quizzes`, payload);
  }

  publicQuiz(slug: string) {
    return this.http.get<ApiItem>(`${this.api}/public/quizzes/${slug}`);
  }

  submitQuizLead(slug: string, payload: ApiItem) {
    return this.http.post<ApiItem>(
      `${this.api}/public/quizzes/${slug}/leads`,
      payload,
    );
  }

  updateQuiz(id: string, payload: ApiItem) {
    return this.http.patch<ApiItem>(`${this.api}/quizzes/${id}`, payload);
  }

  myAffiliations() {
    return this.http.get<ApiItem[]>(`${this.api}/affiliates/mine`);
  }

  affiliationRequests() {
    return this.http.get<ApiItem[]>(`${this.api}/affiliates/requests`);
  }

  requestAffiliation(payload: { productSlug: string; displayName: string }) {
    return this.http.post<ApiItem>(
      `${this.api}/affiliates/request`,
      payload,
    );
  }

  reviewAffiliation(id: string, payload: ApiItem) {
    return this.http.patch<ApiItem>(`${this.api}/affiliates/${id}`, payload);
  }

  whatsappConnection() {
    return this.http.get<ApiItem | null>(
      `${this.api}/automations/connection`,
    );
  }

  connectWhatsapp(payload: ApiItem) {
    return this.http.post<ApiItem>(
      `${this.api}/automations/connection`,
      payload,
    );
  }

  flowTemplates() {
    return this.http.get<ApiItem[]>(`${this.api}/automations/templates`);
  }

  flows() {
    return this.http.get<ApiItem[]>(`${this.api}/automations/flows`);
  }

  createFlow(payload: ApiItem) {
    return this.http.post<ApiItem>(`${this.api}/automations/flows`, payload);
  }

  updateFlow(id: string, payload: ApiItem) {
    return this.http.patch<ApiItem>(
      `${this.api}/automations/flows/${id}`,
      payload,
    );
  }

  automationReports() {
    return this.http.get<ApiItem>(`${this.api}/automations/reports`);
  }

  webhookEndpoints() {
    return this.http.get<ApiItem[]>(`${this.api}/outbound-webhooks`);
  }

  webhookDeliveries() {
    return this.http.get<ApiItem[]>(
      `${this.api}/outbound-webhooks/deliveries`,
    );
  }

  createWebhook(payload: { url: string; events: string[] }) {
    return this.http.post<ApiItem>(`${this.api}/outbound-webhooks`, payload);
  }

  replayWebhook(id: string) {
    return this.http.post<ApiItem>(
      `${this.api}/outbound-webhooks/deliveries/${id}/replay`,
      {},
    );
  }

  admin(resource: string, params: Record<string, string> = {}) {
    return this.http.get<any>(`${this.api}/admin/${resource}`, {
      params: this.params(params),
    });
  }

  setAccountStatus(id: string, status: string) {
    return this.http.patch<ApiItem>(`${this.api}/admin/accounts/${id}/status`, {
      status,
    });
  }

  setFee(id: string, payload: ApiItem) {
    return this.http.put<ApiItem>(
      `${this.api}/admin/accounts/${id}/fees`,
      payload,
    );
  }

  reviewWithdrawal(id: string, payload: ApiItem) {
    return this.http.patch<ApiItem>(
      `${this.api}/admin/withdrawals/${id}`,
      payload,
    );
  }

  private params(values: Record<string, string>) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value) params = params.set(key, value);
    }
    return params;
  }
}
