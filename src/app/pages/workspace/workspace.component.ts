import { Component, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiItem, PlatformService } from '../../core/platform.service';
import { Product, ProductsService } from '../../core/products.service';
import { BpIconComponent } from '../../shared/icon.component';
import { apiErrorMessage } from '../../shared/api-error';
import { formatBrlFromCents } from '../../shared/money';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [FormsModule, BpIconComponent],
  template: `
    <section class="workspace">
      <header class="page-header">
        <div>
          <p class="eyebrow">Área do produtor</p>
          <h1>{{ title() }}</h1>
          <p class="muted">{{ subtitle() }}</p>
        </div>
        <div class="header-actions">
          @if (section() === 'flows') {
            <button class="btn" type="button" (click)="openFlowModal()"><bp-icon name="plus" /> Criar primeiro fluxo</button>
          }
          <button class="btn secondary" type="button" (click)="load()">Atualizar</button>
        </div>
      </header>
      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (message()) { <p class="success">{{ message() }}</p> }
      @if (loading()) {
        <div class="panel">Carregando...</div>
      } @else if (section() === 'sales') {
        <form class="filters panel" (ngSubmit)="loadSales()">
          <label class="field">Busca <input name="q" [(ngModel)]="filters.q" placeholder="Pedido, cliente ou e-mail"></label>
          <label class="field">Status
            <select name="status" [(ngModel)]="filters.status">
              <option value="">Todos</option><option value="pending">Pendente</option><option value="paid">Pago</option>
              <option value="rejected">Rejeitado</option><option value="refunded">Reembolsado</option>
            </select>
          </label>
          <label class="field">Tipo
            <select name="type" [(ngModel)]="filters.type"><option value="">Todos</option><option value="PRODUCT">Produto</option><option value="ORDER_BUMP">Order bump</option></select>
          </label>
          <label class="field">Método
            <select name="method" [(ngModel)]="filters.method"><option value="">Todos</option><option value="PIX">Pix</option><option value="CARD">Cartão</option><option value="BOLETO">Boleto</option></select>
          </label>
          <label class="field">De <input type="date" name="from" [(ngModel)]="filters.from"></label>
          <label class="field">Até <input type="date" name="to" [(ngModel)]="filters.to"></label>
          <button class="btn" type="submit">Filtrar</button>
        </form>
        <div class="summary">
          <article class="metric tone-info">
            <div class="metric-top"><span class="metric-label">Transações</span><div class="metric-icon"><bp-icon name="sales" /></div></div>
            <strong class="metric-value">{{ sales()['summary']?.transactions || 0 }}</strong>
            <span class="metric-hint">Volume no filtro</span>
          </article>
          <article class="metric" [class.tone-up]="(sales()['summary']?.paid || 0) > 0" [class.tone-warn]="!(sales()['summary']?.paid || 0)">
            <div class="metric-top"><span class="metric-label">Pagas</span><div class="metric-icon"><bp-icon name="check" /></div></div>
            <strong class="metric-value">{{ sales()['summary']?.paid || 0 }}</strong>
            <span class="metric-delta" [class.up]="(sales()['summary']?.paid || 0) > 0"><bp-icon name="trendUp" /> Aprovadas</span>
          </article>
          <article class="metric tone-money">
            <div class="metric-top"><span class="metric-label">Receita</span><div class="metric-icon"><bp-icon name="revenue" /></div></div>
            <strong class="metric-value">{{ money(sales()['summary']?.revenueCents || 0) }}</strong>
            <span class="metric-hint">Total pago</span>
          </article>
        </div>
        <div class="panel table-wrap">
          <table><thead><tr><th>Data</th><th>Cliente</th><th>Produto</th><th>Método</th><th>Status</th><th>Valor</th></tr></thead>
          <tbody>@for (sale of sales()['items'] || []; track sale.id) {
            <tr>
              <td>{{ date(sale.createdAt) }}</td>
              <td>{{ sale.customer?.name || 'Não informado' }}<small>{{ sale.customer?.email }}</small></td>
              <td>{{ sale.product?.title }}</td>
              <td>{{ sale.payments?.[0]?.method || '-' }}</td>
              <td><span [class]="'badge ' + statusTone(sale.status)">{{ sale.status }}</span></td>
              <td [class.num-money]="sale.status === 'paid'" [class.num-down]="sale.status === 'rejected' || sale.status === 'refunded'">{{ money(sale.amountCents) }}</td>
            </tr>
          } @empty { <tr><td colspan="6">Nenhuma venda encontrada.</td></tr> }</tbody></table>
        </div>
      } @else if (section() === 'fees') {
        <div class="summary">
          @for (method of ['PIX', 'CARD', 'BOLETO']; track method) {
            <article class="metric tone-info">
              <div class="metric-top"><span class="metric-label">{{ method }}</span><div class="metric-icon"><bp-icon name="fees" /></div></div>
              <strong class="metric-value">{{ feeLabel(method) }}</strong>
              <span class="metric-hint">Configuração vigente</span>
            </article>
          }
        </div>
      } @else if (section() === 'subscriptions') {
        <div class="summary">
          <article class="metric" [class.tone-up]="(metrics()['active'] || 0) > 0" [class.tone-warn]="!(metrics()['active'] || 0)">
            <div class="metric-top"><span class="metric-label">Ativos</span><div class="metric-icon"><bp-icon name="subscriptions" /></div></div>
            <strong class="metric-value">{{ metrics()['active'] || 0 }}</strong>
            <span class="metric-hint">Assinaturas vivas</span>
          </article>
          <article class="metric tone-money">
            <div class="metric-top"><span class="metric-label">MRR</span><div class="metric-icon"><bp-icon name="revenue" /></div></div>
            <strong class="metric-value">{{ money(metrics()['mrrCents'] || 0) }}</strong>
            <span class="metric-delta up"><bp-icon name="trendUp" /> Recorrente</span>
          </article>
          <article class="metric tone-money">
            <div class="metric-top"><span class="metric-label">ARR</span><div class="metric-icon"><bp-icon name="spark" /></div></div>
            <strong class="metric-value">{{ money(metrics()['arrCents'] || 0) }}</strong>
            <span class="metric-hint">Projeção anual</span>
          </article>
          <article class="metric" [class.tone-down]="(metrics()['monthlyChurn'] || 0) > 0.05" [class.tone-up]="(metrics()['monthlyChurn'] || 0) <= 0.05">
            <div class="metric-top"><span class="metric-label">Churn mensal</span><div class="metric-icon"><bp-icon name="trendDown" /></div></div>
            <strong class="metric-value">{{ percent(metrics()['monthlyChurn'] || 0) }}</strong>
            <span class="metric-delta" [class.down]="(metrics()['monthlyChurn'] || 0) > 0.05" [class.up]="(metrics()['monthlyChurn'] || 0) <= 0.05">
              <bp-icon [name]="(metrics()['monthlyChurn'] || 0) > 0.05 ? 'alert' : 'check'" />
              {{ (metrics()['monthlyChurn'] || 0) > 0.05 ? 'Atenção' : 'Saudável' }}
            </span>
          </article>
          <article class="metric" [class.tone-down]="(metrics()['annualChurn'] || 0) > 0.2" [class.tone-warn]="(metrics()['annualChurn'] || 0) <= 0.2">
            <div class="metric-top"><span class="metric-label">Churn anual</span><div class="metric-icon"><bp-icon name="alert" /></div></div>
            <strong class="metric-value">{{ percent(metrics()['annualChurn'] || 0) }}</strong>
            <span class="metric-hint">Últimos 12 meses</span>
          </article>
        </div>
        <section class="chart-board">
          <h2>Saúde da recorrência</h2>
          <p class="muted">MRR vs churn no ciclo atual</p>
          <div class="funnel">
            @for (row of subscriptionHealth(); track row.label) {
              <div class="funnel-row" [class.tone-down]="row.tone === 'down'" [class.tone-up]="row.tone === 'up'">
                <span><bp-icon [name]="row.icon" /> {{ row.label }}</span>
                <div class="funnel-track"><div class="funnel-fill" [class.fill-down]="row.tone === 'down'" [style.width.%]="row.pct"></div></div>
                <strong>{{ row.display }}</strong>
              </div>
            }
          </div>
        </section>
        <form class="panel form-row" (ngSubmit)="createPlan()">
          <h2>Novo plano</h2>
          <label class="field">Produto<select name="productId" [(ngModel)]="plan.productId" required>@for(product of products(); track product.id){<option [value]="product.id">{{ product.title }}</option>}</select></label>
          <label class="field">Nome<input name="planName" [(ngModel)]="plan.name" required></label>
          <label class="field">Valor em centavos<input type="number" name="planAmount" [(ngModel)]="plan.amountCents" min="100" required></label>
          <label class="field">Intervalo (meses)<input type="number" name="interval" [(ngModel)]="plan.intervalMonths" min="1" max="12"></label>
          <button class="btn" type="submit">Criar plano</button>
        </form>
        <div class="panel table-wrap"><h2>Assinaturas</h2><table><thead><tr><th>Cliente</th><th>Plano</th><th>Status</th><th>Próxima renovação</th><th></th></tr></thead>
          <tbody>@for(item of items(); track item.id){<tr><td>{{ item.customer?.name }}<small>{{ item.customer?.email }}</small></td><td>{{ item.plan?.name }}</td><td><span [class]="'badge ' + statusTone(item.status)">{{ item.status }}</span></td><td>{{ date(item.currentPeriodEnd) }}</td><td>@if(item.status === 'ACTIVE'){<button class="link" (click)="cancelSubscription(item.id)">Cancelar</button>}</td></tr>} @empty{<tr><td colspan="5">Nenhuma assinatura.</td></tr>}</tbody></table></div>
      } @else if (section() === 'quizzes') {
        <form class="panel form-row" (ngSubmit)="createQuiz()"><h2>Novo quiz</h2>
          <label class="field">Título<input name="quizTitle" [(ngModel)]="quizTitle" required></label>
          <label class="field">Produto (opcional)<select name="quizProduct" [(ngModel)]="quizProductId"><option value="">Nenhum</option>@for(product of products(); track product.id){<option [value]="product.id">{{ product.title }}</option>}</select></label>
          <button class="btn" type="submit">Criar funil</button>
        </form>
        <div class="grid">@for(item of items(); track item.id){<article class="panel list-card">
          <div class="list-card-top">
            <div class="metric-icon"><bp-icon name="quizzes" /></div>
            <span [class]="'badge ' + statusTone(item.status)">{{ item.status }}</span>
          </div>
          <h2>{{ item.title }}</h2>
          <p class="muted"><bp-icon name="users" /> {{ item._count?.leads || 0 }} leads · {{ item.steps?.length || 0 }} perguntas</p>
          <div class="actions"><button class="link" type="button" (click)="editQuiz(item)">Editar perguntas</button><button class="link" type="button" (click)="copyQuizLink(item.slug)">Copiar link</button>
          @if(item.status !== 'PUBLISHED'){<button class="link" type="button" (click)="publishQuiz(item.id)">Publicar</button>}</div></article>} @empty{<div class="panel">Crie seu primeiro funil interativo.</div>}</div>
        @if(editingQuiz()){
          <form class="panel quiz-editor" (ngSubmit)="saveQuizSteps()">
            <div class="editor-heading"><div><p class="eyebrow">Editor</p><h2>{{ editingQuiz().title }}</h2></div><button class="link" type="button" (click)="closeQuizEditor()">Fechar</button></div>
            @for(step of quizSteps; track $index; let index = $index){
              <div class="quiz-step">
                <strong>Pergunta {{ index + 1 }}</strong>
                <label class="field">Tipo<select [name]="'stepType' + index" [(ngModel)]="step.type"><option value="TEXT">Texto livre</option><option value="SINGLE_CHOICE">Escolha única</option></select></label>
                <label class="field">Pergunta<input [name]="'stepTitle' + index" [(ngModel)]="step.title" required></label>
                @if(step.type === 'TEXT'){<label class="field">Placeholder<input [name]="'placeholder' + index" [(ngModel)]="step.placeholder"></label>}
                @else{<label class="field">Opções (uma por linha)<textarea [name]="'options' + index" [(ngModel)]="step.optionsText" rows="4" required></textarea></label>}
                <div class="actions"><button class="link" type="button" (click)="moveQuizStep(index, -1)" [disabled]="index === 0">Subir</button><button class="link" type="button" (click)="moveQuizStep(index, 1)" [disabled]="index === quizSteps.length - 1">Descer</button><button class="link danger" type="button" (click)="removeQuizStep(index)">Remover</button></div>
              </div>
            }
            <div class="actions"><button class="btn secondary" type="button" (click)="addQuizStep()">Adicionar pergunta</button><button class="btn" type="submit">Salvar perguntas</button></div>
          </form>
        }
      } @else if (section() === 'affiliates') {
        <form class="panel form-row" (ngSubmit)="requestAffiliation()"><h2>Solicitar afiliação</h2>
          <label class="field">Slug do produto<input name="productSlug" [(ngModel)]="affiliate.productSlug" required></label>
          <label class="field">Nome de divulgação<input name="displayName" [(ngModel)]="affiliate.displayName" required></label>
          <button class="btn" type="submit">Solicitar</button>
        </form>
        <div class="panel table-wrap"><h2>Minhas afiliações</h2><table><thead><tr><th>Produto</th><th>Status</th><th>Comissão</th><th>Link</th></tr></thead><tbody>
          @for(item of items(); track item.id){<tr><td>{{ item.product?.title }}</td><td>{{ item.status }}</td><td>{{ item.commissionPercentageBps / 100 }}%</td><td><button class="link" type="button" (click)="copyAffiliateLink(item)">Copiar link</button></td></tr>} @empty{<tr><td colspan="4">Nenhuma afiliação.</td></tr>}
        </tbody></table></div>
        @if(requests().length){<div class="panel table-wrap"><h2>Solicitações para seus produtos</h2><table><thead><tr><th>Afiliado</th><th>Produto</th><th>Status</th><th>Comissão</th><th></th></tr></thead><tbody>@for(item of requests(); track item.id){<tr><td>{{ item.affiliateProfile?.displayName }}</td><td>{{ item.product?.title }}</td><td>{{ item.status }}</td><td>@if(item.status === 'REQUESTED'){<input class="commission" type="number" min="0" max="100" [name]="'commission' + item.id" [(ngModel)]="approvalPercentage[item.id]"> %} @else { {{ item.commissionPercentageBps / 100 }}% }</td><td>@if(item.status === 'REQUESTED'){<button class="link" type="button" (click)="approveAffiliation(item.id)">Aprovar</button>}</td></tr>}</tbody></table></div>}
      } @else if (section() === 'flows') {
        <div class="panel connection">
          <div><h2>WhatsApp Cloud API</h2><p class="muted">{{ connection() ? 'Conta conectada' : 'Conecte sua conta para ativar os fluxos.' }}</p></div>
          @if(!connection()){<form class="form-row panel form" (ngSubmit)="connectWhatsapp()">
            <label class="field">Phone Number ID<input name="phoneId" [(ngModel)]="whatsapp.phoneNumberId" required></label>
            <label class="field">Business Account ID<input name="businessId" [(ngModel)]="whatsapp.businessAccountId" required></label>
            <label class="field">Access token<input type="password" name="accessToken" [(ngModel)]="whatsapp.accessToken" required></label>
            <label class="field">Verify token<input type="password" name="verifyToken" [(ngModel)]="whatsapp.verifyToken" required></label>
            <button class="btn" type="submit">Conectar</button>
          </form>}
        </div>
        <div class="grid">
          @for(item of items(); track item.id){
            <article class="panel list-card">
              <div class="list-card-top">
                <div class="metric-icon"><bp-icon [name]="flowIcon(item.trigger)" /></div>
                <span [class]="'badge ' + statusTone(item.status)">{{ item.status }}</span>
              </div>
              <h2>{{ item.name }}</h2>
              <p class="muted"><bp-icon name="zap" /> {{ item.trigger }} · {{ item._count?.runs || 0 }} execuções</p>
              <button class="link" type="button" (click)="toggleFlow(item)">{{ item.status === 'ACTIVE' ? 'Pausar' : 'Ativar' }}</button>
            </article>
          } @empty {
            <div class="empty-flows">
              <div class="metric-icon empty-icon"><bp-icon name="flows" /></div>
              <h2>Nenhum fluxo ainda</h2>
              <p class="muted">Escolha um template e configure o nome do template aprovado na Meta.</p>
              <button class="btn" type="button" (click)="openFlowModal()"><bp-icon name="plus" /> Criar primeiro fluxo</button>
            </div>
          }
        </div>

        @if (flowModalOpen()) {
          <div class="modal-scrim" (click)="closeFlowModal()" role="presentation">
            <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="flow-modal-title">
              <div class="modal-head">
                <div>
                  <p class="eyebrow">Automação</p>
                  <h2 id="flow-modal-title">{{ selectedFlowTemplate() ? 'Configurar fluxo' : 'Criar primeiro fluxo' }}</h2>
                </div>
                <button class="modal-close" type="button" aria-label="Fechar" (click)="closeFlowModal()">×</button>
              </div>

              @if (!selectedFlowTemplate()) {
                <p class="muted modal-lead">Selecione o evento que dispara a mensagem.</p>
                <div class="template-grid modal-templates">
                  @for (template of templates(); track template.trigger) {
                    <button class="template" type="button" (click)="selectFlowTemplate(template)">
                      <div class="metric-icon template-icon"><bp-icon [name]="flowIcon(template.trigger)" /></div>
                      <span class="template-copy">
                        <strong>{{ template.name }}</strong>
                        <small>{{ template.trigger }}</small>
                      </span>
                      <bp-icon name="conversion" class="template-chevron" />
                    </button>
                  }
                </div>
              } @else {
                <form class="flow-form" (ngSubmit)="createFlow()">
                  <p class="muted">Template: <strong>{{ selectedFlowTemplate()?.name }}</strong></p>
                  <label class="field">Nome do fluxo<input name="flowName" [(ngModel)]="flowDraft.name" required></label>
                  <label class="field">Template aprovado na Meta<input name="templateName" [(ngModel)]="flowDraft.templateName" required placeholder="ex: pedido_pago"></label>
                  <label class="field">Idioma
                    <select name="flowLanguage" [(ngModel)]="flowDraft.language">
                      <option value="pt_BR">Português (Brasil)</option>
                      <option value="en_US">English (US)</option>
                      <option value="es">Español</option>
                    </select>
                  </label>
                  <div class="actions">
                    <button class="link" type="button" (click)="selectedFlowTemplate.set(null)">Trocar template</button>
                    <button class="btn secondary" type="button" (click)="closeFlowModal()">Cancelar</button>
                    <button class="btn" type="submit">Criar rascunho</button>
                  </div>
                </form>
              }
            </div>
          </div>
        }
      } @else if (section() === 'reports') {
        <div class="summary">
          <article class="metric tone-info">
            <div class="metric-top"><span class="metric-label">Enviadas</span><div class="metric-icon"><bp-icon name="send" /></div></div>
            <strong class="metric-value">{{ metrics()['sent'] || 0 }}</strong>
            <span class="metric-hint">Mensagens disparadas</span>
          </article>
          <article class="metric tone-up">
            <div class="metric-top"><span class="metric-label">Entregues</span><div class="metric-icon"><bp-icon name="check" /></div></div>
            <strong class="metric-value">{{ metrics()['delivered'] || 0 }}</strong>
            <span class="metric-delta up"><bp-icon name="trendUp" /> Chegaram</span>
          </article>
          <article class="metric tone-money">
            <div class="metric-top"><span class="metric-label">Lidas</span><div class="metric-icon"><bp-icon name="eye" /></div></div>
            <strong class="metric-value">{{ metrics()['read'] || 0 }}</strong>
            <span class="metric-hint">Engajamento</span>
          </article>
          <article class="metric" [class.tone-down]="(metrics()['failed'] || 0) > 0" [class.tone-up]="!(metrics()['failed'] || 0)">
            <div class="metric-top"><span class="metric-label">Falhas</span><div class="metric-icon"><bp-icon name="alert" /></div></div>
            <strong class="metric-value">{{ metrics()['failed'] || 0 }}</strong>
            <span class="metric-delta" [class.down]="(metrics()['failed'] || 0) > 0" [class.up]="!(metrics()['failed'] || 0)">
              <bp-icon [name]="(metrics()['failed'] || 0) > 0 ? 'trendDown' : 'check'" />
              {{ (metrics()['failed'] || 0) > 0 ? 'Requer atenção' : 'Tudo limpo' }}
            </span>
          </article>
        </div>
        <section class="chart-board">
          <h2>Funil de entrega</h2>
          <p class="muted">Do envio à leitura — e onde as falhas aparecem.</p>
          <div class="funnel">
            @for (row of reportFunnel(); track row.label) {
              <div class="funnel-row" [class.tone-down]="row.tone === 'down'" [class.tone-up]="row.tone === 'up'">
                <span><bp-icon [name]="row.icon" /> {{ row.label }}</span>
                <div class="funnel-track"><div class="funnel-fill" [class.fill-down]="row.tone === 'down'" [style.width.%]="row.pct"></div></div>
                <strong>{{ row.value }}</strong>
              </div>
            }
          </div>
        </section>
      } @else if (section() === 'withdrawals') {
        <div class="summary">
          <article class="metric tone-up">
            <div class="metric-top"><span class="metric-label">Disponível</span><div class="metric-icon"><bp-icon name="wallet" /></div></div>
            <strong class="metric-value">{{ money(balance()['availableCents'] || 0) }}</strong>
            <span class="metric-delta up"><bp-icon name="check" /> Pronto para saque</span>
          </article>
          <article class="metric tone-warn">
            <div class="metric-top"><span class="metric-label">Pendente</span><div class="metric-icon"><bp-icon name="alert" /></div></div>
            <strong class="metric-value">{{ money(balance()['pendingCents'] || 0) }}</strong>
            <span class="metric-hint">Em liquidação</span>
          </article>
          <article class="metric tone-info">
            <div class="metric-top"><span class="metric-label">Reservado</span><div class="metric-icon"><bp-icon name="shield" /></div></div>
            <strong class="metric-value">{{ money(balance()['reservedCents'] || 0) }}</strong>
            <span class="metric-hint">Bloqueado / reserva</span>
          </article>
        </div>
        <form class="panel form-row" (ngSubmit)="requestWithdrawal()"><h2>Solicitar saque</h2><label class="field">Valor em centavos<input type="number" name="withdrawAmount" [(ngModel)]="withdraw.amountCents" min="100" required></label><label class="field">Chave Pix<input name="pixKey" [(ngModel)]="withdraw.pixKey" required></label><button class="btn" type="submit">Solicitar</button></form>
        <div class="panel table-wrap"><table><thead><tr><th>Data</th><th>Valor</th><th>Status</th><th>Motivo</th></tr></thead><tbody>@for(item of items(); track item.id){<tr><td>{{ date(item.createdAt) }}</td><td class="num-money">{{ money(item.amountCents) }}</td><td><span [class]="'badge ' + statusTone(item.status)">{{ item.status }}</span></td><td>{{ item.reason || '-' }}</td></tr>} @empty{<tr><td colspan="4">Nenhum saque realizado.</td></tr>}</tbody></table></div>
      } @else if (section() === 'webhooks') {
        <form class="panel form-row" (ngSubmit)="createWebhook()"><h2>Novo endpoint</h2><label class="field">URL HTTPS<input type="url" name="webhookUrl" [(ngModel)]="webhook.url" required></label><label class="field">Eventos separados por vírgula<input name="events" [(ngModel)]="webhook.events" placeholder="order.paid, subscription.renewed" required></label><button class="btn" type="submit">Criar webhook</button></form>
        @if(secret()){<p class="secret">Copie o segredo agora: <code>{{ secret() }}</code></p>}
        <div class="grid">@for(item of items(); track item.id){<article class="panel"><span [class]="'badge ' + (item.active ? 'active' : 'paused')">{{ item.active ? 'ATIVO' : 'INATIVO' }}</span><h2>{{ item.url }}</h2><p class="muted"><bp-icon name="webhooks" /> {{ item.events?.join(', ') }}</p><small>{{ item._count?.deliveries || 0 }} entregas</small></article>} @empty{<div class="panel">Nenhum endpoint configurado.</div>}</div>
        <div class="panel table-wrap"><h2>Entregas recentes</h2><table><tbody>@for(item of deliveries(); track item.id){<tr><td>{{ item.eventType }}</td><td><span [class]="'badge ' + statusTone(item.status)">{{ item.status }}</span></td><td>{{ item.responseStatus || '-' }}</td><td>@if(item.status === 'DEAD'){<button class="link" (click)="replay(item.id)">Reenviar</button>}</td></tr>} @empty{<tr><td>Nenhuma entrega.</td></tr>}</tbody></table></div>
      }
    </section>
  `,
  styles: `
    .filters, .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
      gap: 14px;
      align-items: end;
      margin-bottom: 20px;
    }
    .form-row h2 { grid-column: 1 / -1; margin: 0; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
      gap: 0;
      margin: 8px 0 20px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .grid > .panel {
      background: transparent;
      border: 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      border-radius: 0;
      padding: 18px 16px 18px 0;
    }
    .template-grid.modal-templates {
      display: grid;
      gap: 8px;
      margin: 0;
      border: 0;
    }
    .template {
      display: grid;
      grid-template-columns: 40px 1fr 16px;
      align-items: center;
      gap: 12px;
      width: 100%;
      text-align: left;
      cursor: pointer;
      color: inherit;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 12px;
      transition: border-color 0.18s var(--bp-ease), background 0.18s var(--bp-ease);
    }
    .template:hover {
      border-color: rgba(245, 197, 24, 0.4);
      background: rgba(245, 197, 24, 0.06);
      color: var(--bp-cream);
    }
    .template-icon { width: 40px !important; height: 40px !important; }
    .template-copy { min-width: 0; display: grid; gap: 2px; text-align: left; }
    .template strong, .template small { display: block; }
    .template strong { font-size: 0.95rem; margin: 0; line-height: 1.25; }
    .template small { color: var(--bp-cream-muted); margin-top: 0; font-size: 11px; letter-spacing: 0.04em; }
    .template-chevron { --bp-icon-size: 14px; width: 14px; height: 14px; color: var(--bp-cream-muted); flex-shrink: 0; }
    .template:hover .template-chevron { color: var(--bp-banana); }
    .empty-flows { justify-items: start; }
    .empty-icon { margin-bottom: 4px; }
    .list-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }
    .list-card h2 { margin: 0 0 6px; }
    .link { border: 0; background: transparent; color: var(--bp-banana); cursor: pointer; padding: 0; font-weight: 600; }
    .secret {
      border-left: 2px solid var(--bp-banana);
      color: var(--bp-banana);
      padding: 10px 0 10px 14px;
      word-break: break-all;
      background: transparent;
    }
    .connection { margin-bottom: 20px; }
    .empty-flows { padding: 28px 0; display: grid; gap: 10px; justify-items: start; }
    .empty-flows .btn { width: auto; }
    .modal-lead { margin: 0 0 16px; }
    .modal-templates { border-top: 1px solid rgba(255,255,255,0.08); margin: 0; }
    .flow-form { display: grid; gap: 14px; }
    .flow-form .actions { justify-content: flex-end; }
    .actions { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; margin-top: 14px; }
    .quiz-editor { margin-top: 20px; }
    .editor-heading { display: flex; justify-content: space-between; gap: 20px; align-items: start; }
    .quiz-step { display: grid; gap: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding: 20px 0; }
    .quiz-step textarea { width: 100%; }
    .danger { color: var(--bp-danger); }
    .commission { width: 72px; padding: 6px; }
    .muted bp-icon,
    .funnel-row bp-icon,
    .btn bp-icon {
      --bp-icon-size: 14px;
      width: 14px;
      height: 14px;
    }
    .funnel-row.tone-up strong { color: var(--bp-success); }
    .funnel-row.tone-down strong { color: var(--bp-danger); }
    .fill-down { background: linear-gradient(90deg, #c43c3c, var(--bp-danger)) !important; }

    @media (max-width: 800px) {
      .filters, .form-row {
        grid-template-columns: 1fr 1fr;
      }
      .filters .btn,
      .form-row .btn {
        grid-column: 1 / -1;
        width: 100%;
      }
      .editor-heading {
        flex-direction: column;
        align-items: stretch;
      }
      .actions {
        gap: 10px;
      }
      .flow-form .actions {
        justify-content: stretch;
      }
      .flow-form .actions .btn {
        flex: 1;
      }
      .grid {
        grid-template-columns: 1fr;
      }
      .grid > .panel {
        padding-right: 0;
      }
    }

    @media (max-width: 560px) {
      .filters, .form-row {
        grid-template-columns: 1fr;
      }
      .template {
        grid-template-columns: 36px 1fr 14px;
        gap: 10px;
        padding: 10px;
      }
      .template-icon {
        width: 36px !important;
        height: 36px !important;
      }
      .connection .form-row {
        grid-template-columns: 1fr;
      }
      .empty-flows .btn {
        width: 100%;
      }
      .commission {
        width: 100%;
      }
    }
  `,
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  readonly section = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly message = signal('');
  readonly items = signal<ApiItem[]>([]);
  readonly requests = signal<ApiItem[]>([]);
  readonly deliveries = signal<ApiItem[]>([]);
  readonly templates = signal<ApiItem[]>([]);
  readonly connection = signal<ApiItem | null>(null);
  readonly metrics = signal<ApiItem>({});
  readonly balance = signal<ApiItem>({});
  readonly sales = signal<ApiItem>({});
  readonly fees = signal<ApiItem[]>([]);
  readonly products = signal<Product[]>([]);
  readonly secret = signal('');
  readonly editingQuiz = signal<ApiItem | null>(null);
  readonly selectedFlowTemplate = signal<ApiItem | null>(null);
  readonly flowModalOpen = signal(false);
  readonly money = formatBrlFromCents;
  filters = { q: '', status: '', type: '', method: '', from: '', to: '' };
  plan = { productId: '', name: '', amountCents: 0, intervalMonths: 1 };
  quizTitle = '';
  quizProductId = '';
  quizSteps: { type: string; title: string; placeholder: string; optionsText: string }[] = [];
  affiliate = { productSlug: '', displayName: '' };
  approvalPercentage: Record<string, number> = {};
  whatsapp = { phoneNumberId: '', businessAccountId: '', accessToken: '', verifyToken: '' };
  flowDraft = { name: '', templateName: '', language: 'pt_BR' };
  withdraw = { amountCents: 0, pixKey: '' };
  webhook = { url: '', events: 'order.paid' };
  private routeSubscription?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly platform: PlatformService,
    private readonly productsService: ProductsService,
  ) {}

  ngOnInit() {
    this.routeSubscription = this.route.data.subscribe((data) => {
      this.section.set(data['section']);
      this.load();
    });
  }

  ngOnDestroy() { this.routeSubscription?.unsubscribe(); }

  title() {
    const titles: Record<string, string> = { sales: 'Vendas', fees: 'Taxas', subscriptions: 'Assinaturas', quizzes: 'Quizzes', affiliates: 'Afiliados', flows: 'Fluxos de WhatsApp', reports: 'Relatórios de WhatsApp', withdrawals: 'Saques', webhooks: 'Webhooks' };
    return titles[this.section()] ?? 'Área interna';
  }

  subtitle() {
    const subtitles: Record<string, string> = { sales: 'Busque e acompanhe todas as transações.', fees: 'Veja em tempo real as taxas da sua conta.', subscriptions: 'Receita recorrente, retenção e clientes ativos.', quizzes: 'Funis interativos que convertem visitantes em clientes.', affiliates: 'Gerencie solicitações, links e comissões.', flows: 'Automatize conversas a partir de eventos do produto.', reports: 'Acompanhe envios, entregas, leituras e falhas.', withdrawals: 'Saldo e histórico de repasses.', webhooks: 'Integre eventos da plataforma aos seus sistemas.' };
    return subtitles[this.section()] ?? '';
  }

  load() {
    this.loading.set(true); this.error.set(''); this.message.set('');
    const section = this.section();
    if (['subscriptions', 'quizzes'].includes(section)) this.loadProducts();
    if (section === 'sales') return this.loadSales();
    if (section === 'fees') return this.subscribe(this.platform.fees(), (items) => this.fees.set(items));
    if (section === 'subscriptions') {
      this.platform.subscriptionMetrics().subscribe((value) => this.metrics.set(value));
      return this.subscribe(this.platform.subscriptions(), (items) => this.items.set(items));
    }
    if (section === 'quizzes') return this.subscribe(this.platform.quizzes(), (items) => this.items.set(items));
    if (section === 'affiliates') {
      this.platform.affiliationRequests().subscribe((items) => {
        this.requests.set(items);
        for (const item of items) {
          this.approvalPercentage[item.id] ??= 20;
        }
      });
      return this.subscribe(this.platform.myAffiliations(), (items) => this.items.set(items));
    }
    if (section === 'flows') {
      this.platform.flowTemplates().subscribe((items) => this.templates.set(items));
      this.platform.whatsappConnection().subscribe((value) => this.connection.set(value));
      return this.subscribe(this.platform.flows(), (items) => this.items.set(items));
    }
    if (section === 'reports') return this.subscribe(this.platform.automationReports(), (value) => this.metrics.set(value));
    if (section === 'withdrawals') {
      this.platform.balance().subscribe((value) => this.balance.set(value));
      return this.subscribe(this.platform.withdrawals(), (items) => this.items.set(items));
    }
    if (section === 'webhooks') {
      this.platform.webhookDeliveries().subscribe((items) => this.deliveries.set(items));
      return this.subscribe(this.platform.webhookEndpoints(), (items) => this.items.set(items));
    }
    this.loading.set(false);
  }

  loadSales() { this.subscribe(this.platform.sales(this.filters), (value) => this.sales.set(value)); }
  createPlan() { this.action(this.platform.createPlan(this.plan)); }
  createQuiz() { this.action(this.platform.createQuiz({ title: this.quizTitle, productId: this.quizProductId || undefined, steps: [] })); }
  publishQuiz(id: string) { this.action(this.platform.updateQuiz(id, { status: 'PUBLISHED' })); }
  editQuiz(item: ApiItem) {
    this.editingQuiz.set(item);
    this.quizSteps = (item.steps || []).map((step: ApiItem) => ({
      type: step.type,
      title: step.title,
      placeholder: step.config?.placeholder || '',
      optionsText: (step.config?.options || []).join('\n'),
    }));
  }
  closeQuizEditor() { this.editingQuiz.set(null); this.quizSteps = []; }
  addQuizStep() { this.quizSteps.push({ type: 'TEXT', title: '', placeholder: '', optionsText: '' }); }
  removeQuizStep(index: number) { this.quizSteps.splice(index, 1); }
  moveQuizStep(index: number, direction: number) {
    const target = index + direction;
    if (target < 0 || target >= this.quizSteps.length) return;
    [this.quizSteps[index], this.quizSteps[target]] = [this.quizSteps[target], this.quizSteps[index]];
  }
  saveQuizSteps() {
    const quiz = this.editingQuiz();
    if (!quiz) return;
    const steps = this.quizSteps.map((step) => ({
      type: step.type,
      title: step.title.trim(),
      config: step.type === 'TEXT'
        ? { placeholder: step.placeholder.trim() }
        : { options: step.optionsText.split('\n').map((option) => option.trim()).filter(Boolean) },
    }));
    this.platform.updateQuiz(quiz.id, { steps }).subscribe({
      next: () => { this.closeQuizEditor(); this.done(); },
      error: (error) => this.fail(error),
    });
  }
  copyQuizLink(slug: string) {
    void navigator.clipboard.writeText(`${location.origin}/quiz/${slug}`);
    this.message.set('Link do quiz copiado.');
  }
  requestAffiliation() { this.action(this.platform.requestAffiliation(this.affiliate)); }
  approveAffiliation(id: string) {
    const percentage = this.approvalPercentage[id] ?? 20;
    this.action(this.platform.reviewAffiliation(id, {
      status: 'APPROVED',
      commissionPercentageBps: Math.round(percentage * 100),
    }));
  }
  copyAffiliateLink(item: ApiItem) {
    void navigator.clipboard.writeText(
      `${location.origin}/p/${item.product?.slug}?aff=${item.slug}`,
    );
    this.message.set('Link de afiliado copiado.');
  }
  connectWhatsapp() { this.action(this.platform.connectWhatsapp(this.whatsapp)); }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.flowModalOpen()) this.closeFlowModal();
  }

  openFlowModal() {
    this.selectedFlowTemplate.set(null);
    this.flowDraft = { name: '', templateName: '', language: 'pt_BR' };
    this.flowModalOpen.set(true);
  }

  closeFlowModal() {
    this.flowModalOpen.set(false);
    this.selectedFlowTemplate.set(null);
  }

  selectFlowTemplate(template: ApiItem) {
    this.selectedFlowTemplate.set(template);
    this.flowDraft = { name: template.name, templateName: '', language: 'pt_BR' };
  }

  createFlow() {
    const template = this.selectedFlowTemplate();
    if (!template) return;
    this.platform.createFlow({
      name: this.flowDraft.name,
      trigger: template.trigger,
      config: {
        templateName: this.flowDraft.templateName,
        language: this.flowDraft.language,
      },
    }).subscribe({
      next: () => {
        this.closeFlowModal();
        this.done();
      },
      error: (error) => this.fail(error),
    });
  }

  reportFunnel() {
    const sent = Number(this.metrics()['sent'] || 0);
    const delivered = Number(this.metrics()['delivered'] || 0);
    const read = Number(this.metrics()['read'] || 0);
    const failed = Number(this.metrics()['failed'] || 0);
    const max = Math.max(sent, delivered, read, failed, 1);
    return [
      { label: 'Enviadas', value: sent, pct: (sent / max) * 100, icon: 'send', tone: 'up' },
      { label: 'Entregues', value: delivered, pct: (delivered / max) * 100, icon: 'check', tone: 'up' },
      { label: 'Lidas', value: read, pct: (read / max) * 100, icon: 'eye', tone: 'up' },
      { label: 'Falhas', value: failed, pct: (failed / max) * 100, icon: 'alert', tone: 'down' },
    ];
  }

  subscriptionHealth() {
    const active = Number(this.metrics()['active'] || 0);
    const mrr = Number(this.metrics()['mrrCents'] || 0);
    const monthlyChurn = Number(this.metrics()['monthlyChurn'] || 0);
    const annualChurn = Number(this.metrics()['annualChurn'] || 0);
    return [
      { label: 'Ativos', display: String(active), pct: active ? 100 : 0, icon: 'subscriptions', tone: active ? 'up' : 'down' },
      { label: 'MRR', display: this.money(mrr), pct: mrr ? 100 : 0, icon: 'revenue', tone: 'up' },
      { label: 'Churn mês', display: this.percent(monthlyChurn), pct: Math.min(100, monthlyChurn * 100), icon: 'trendDown', tone: monthlyChurn > 0.05 ? 'down' : 'up' },
      { label: 'Churn ano', display: this.percent(annualChurn), pct: Math.min(100, annualChurn * 100), icon: 'alert', tone: annualChurn > 0.2 ? 'down' : 'up' },
    ];
  }

  statusTone(status: string) {
    const value = String(status || '').toLowerCase();
    if (['paid', 'active', 'published', 'approved', 'success', 'delivered', 'read'].includes(value)) return 'up';
    if (['rejected', 'cancelled', 'failed', 'expired', 'dead', 'refunded', 'danger'].includes(value)) return 'down';
    if (['pending', 'trialing', 'past_due', 'requested', 'processing'].includes(value)) return 'warn';
    if (['paused', 'draft', 'inactive'].includes(value)) return 'info';
    return '';
  }

  flowIcon(trigger: string) {
    const map: Record<string, string> = {
      PIX_PENDING: 'wallet',
      PURCHASE_PAID: 'check',
      BOLETO_PENDING: 'ticket',
      QUIZ_LEAD: 'quizzes',
      SUBSCRIPTION_RENEWAL: 'refresh',
      CUSTOM: 'spark',
    };
    return map[trigger] ?? 'flows';
  }
  toggleFlow(item: ApiItem) { this.action(this.platform.updateFlow(item.id, { status: item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })); }
  requestWithdrawal() { this.action(this.platform.requestWithdrawal(this.withdraw)); }
  createWebhook() { this.platform.createWebhook({ url: this.webhook.url, events: this.webhook.events.split(',').map((item) => item.trim()).filter(Boolean) }).subscribe({ next: (value) => { this.secret.set(value['secret']); this.done(); }, error: (error) => this.fail(error) }); }
  replay(id: string) { this.action(this.platform.replayWebhook(id)); }
  cancelSubscription(id: string) { if (confirm('Cancelar esta assinatura?')) this.action(this.platform.cancelSubscription(id)); }

  feeLabel(method: string) { const fee = this.fees().find((item) => item['method'] === method); return fee ? `${fee['percentageBps'] / 100}% + ${this.money(fee['fixedCents'])}` : 'Não configurada'; }
  date(value: string) { return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '-'; }
  percent(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(value); }

  private loadProducts() { this.productsService.list().subscribe((items) => { this.products.set(items); if (!this.plan.productId && items[0]) this.plan.productId = items[0].id; }); }
  private action(request: ReturnType<PlatformService['createPlan']>) { request.subscribe({ next: () => this.done(), error: (error) => this.fail(error) }); }
  private done() { this.message.set('Alteração salva com sucesso.'); this.load(); }
  private fail(error: unknown) { this.error.set(apiErrorMessage(error, 'Não foi possível concluir a operação')); this.loading.set(false); }
  private subscribe(request: any, next: (value: any) => void) { request.subscribe({ next: (value: any) => { next(value); this.loading.set(false); }, error: (error: unknown) => this.fail(error) }); }
}
