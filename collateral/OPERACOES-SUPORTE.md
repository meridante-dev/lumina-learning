# Academy Platforms — Runbook de Suporte (interno)

> **Interno. Não publicar.** As páginas públicas são `suporte.html` (compromissos) e `termos.html` (contrato).
> Este documento é como os cumprimos na prática.
>
> Versão 1.0 · 2026-07-29

---

## 0. Decisões que precisam do teu OK antes de isto valer

As páginas públicas já estão escritas, mas contêm campos marcados. Nada disto deve ir para um
cliente antes de fechado:

| # | Decisão | Default que escrevi | Estado |
|---|---|---|---|
| D1 | Entidade legal, NIPC, morada, email de suporte | `[ENTIDADE]` `[NIPC]` `[MORADA]` `[SUPPORT-EMAIL]` | **por preencher** |
| D2 | Prazo contratual | Mensal renovável, denúncia 30 dias | confirmar |
| D3 | Prazo de pagamento | 15 dias da fatura | confirmar |
| D4 | Compromisso de disponibilidade | 99,5%/mês | confirmar |
| D5 | Compensação por falha de SLA | 10% da mensalidade ao 2.º mês seguido | confirmar |
| D6 | Limite de responsabilidade | Valor pago nos 12 meses anteriores | confirmar com advogado |
| D7 | Foro | `[COMARCA]` | confirmar |
| D8 | Horário Enterprise 8h–20h | escrito na tabela | confirmar que consegues cumprir |

**Revisão jurídica:** os `termos.html` são uma minuta sólida mas **não são um contrato validado**.
Antes do primeiro cliente pagante fora do círculo próximo, isto passa por advogado — de preferência
o mesmo que vai rever o [SPEC de conformidade 40h](../../edenrise-compliance/SPEC.md), porque as
cláusulas 9 e 11 tocam-se com esse trabalho.

---

## 1. Triagem — como classificar em 30 segundos

A pergunta é sempre **"quantas pessoas estão bloqueadas e há risco para a evidência?"**

| Nível | Teste | Exemplos reais |
|---|---|---|
| **P1** | Ninguém consegue usar, ou a cadeia de evidência pode estar comprometida | Instância fora do ar · login falha para todos · certificados a sair com hash inválido · suspeita de acesso indevido |
| **P2** | Função essencial partida para muitos | Vídeo não reproduz num browser comum · horas não registam · certificado não emite · painel de gestão vazio |
| **P3** | Um utilizador ou caso pontual, com volta | "O João não consegue entrar" · um vídeo específico não carrega · progresso desalinhado numa conta |
| **P4** | Dúvida ou pedido | "Como atribuo formação a um grupo?" · pedido de nova categoria · sugestão de melhoria |

**Regra de ouro:** na dúvida entre dois níveis, **assume o mais grave**. Baixar a prioridade depois
de investigar é aceitável; subir tarde não é.

**Regra da evidência:** qualquer coisa que toque em horas registadas, certificados ou cadeia de
hash é **no mínimo P2**, mesmo que afete uma pessoa só. É o produto inteiro que assenta aí.

---

## 2. O relógio

- Conta **horas úteis**: dias úteis 9h–18h (Lisboa). Enterprise 8h–20h se D8 confirmar.
- Começa **quando o email entra**, não quando o abres.
- Pára na **primeira resposta humana** — uma resposta automática não conta.
- "Primeira resposta" significa: **classificação + o que já sabemos + próximo passo com hora**.
  Não significa solução. Um "recebi, é P2, estou a olhar, dou notícias até às 15h" cumpre.

---

## 3. Templates

### 3.1 Acusar receção (P1/P2)

```
Assunto: [REF-####] {assunto} — recebido, prioridade {P1|P2}

Olá {nome},

Recebi e classifiquei como {P1 crítico | P2 alto}. Estou já a analisar.

O que sei neste momento: {uma frase honesta — mesmo que seja "ainda a reproduzir"}.
Próxima atualização: até às {hora} de hoje.

Se entretanto piorar ou afetar mais pessoas, responda neste fio.

{nome}
Academy Platforms
```

### 3.2 Resolvido

```
Assunto: [REF-####] {assunto} — resolvido

Olá {nome},

Está resolvido. {O que aconteceu, em linguagem simples.}
{O que fizemos.} {O que mudámos para não repetir — se aplicável.}

Confirma do seu lado? Fecho o caso quando me disser que está bem.

{nome}
```

### 3.3 Pedido fora do âmbito (a conversa difícil, feita bem)

```
Olá {nome},

Isso é possível, mas cai fora do que está incluído no plano {plano} — é {produção de
conteúdo | desenvolvimento à medida | integração}.

Estimativa: {esforço} → {valor} €. Se fizer sentido, envio proposta e só avanço depois
do seu OK por escrito. Se preferir, há uma alternativa dentro do que já tem: {alternativa}.

{nome}
```

> Nunca fazer trabalho fora de âmbito "para ajudar" sem aprovação escrita. Uma vez feito de graça,
> passa a ser esperado — e a página pública promete que nada aparece na fatura sem aprovação prévia.

---

## 4. Escalada interna

| Quando | O que acontece |
|---|---|
| P1 aberto | Notificação imediata ao responsável técnico. Largar o que está em mãos. |
| P1 > 2 h sem caminho | Chamada com o responsável de serviço. Decidir: contornar, reverter ou comunicar janela. |
| P2 > 1 dia útil | Sobe a P1 se o impacto não baixou. |
| Cliente escreve **ESCALAR** | Prioridade sobe um nível automaticamente + responsável de serviço notificado. Responder em 1 h útil, mesmo que seja só para marcar a chamada. |
| Falha de SLA 2 meses seguidos | Crédito de 10% na fatura seguinte **sem o cliente ter de pedir**. Nós é que devemos detetar. |

---

## 5. Incidentes — o pós-mortem

Todo o P1 gera um pós-mortem escrito em **48 h**, enviado ao cliente afetado. Formato curto:

1. **O que aconteceu** — em português simples, sem jargão.
2. **Quando** — início, deteção, resolução (com horas).
3. **Impacto** — quem e o quê ficou afetado. Se houve perda de dados, dizê-lo.
4. **Causa** — a real, não a conveniente.
5. **O que mudámos** — a ação concreta que impede a repetição, com data.

Sem culpa individual, sem "por motivos técnicos". A página pública promete isto explicitamente.

---

## 6. Rituais

| Cadência | O quê | Planos |
|---|---|---|
| Diário | Ver caixa de suporte ao início e ao fim do dia | todos |
| Semanal | Rever casos abertos > 3 dias | todos |
| Mensal | Chamada de 30 min de acompanhamento | Signature, Enterprise |
| Mensal | Calcular disponibilidade do mês e registar | todos |
| Trimestral | Revisão estratégica (conclusões, competências, próximos programas) | Enterprise |
| Anual | Confirmar exportação do anexo do Relatório Único antes da janela (2026: 4–31 maio) | todos |

> A última linha é a que mais vale ao cliente e é a mais fácil de esquecer. **Pôr alarme.**

---

## 7. O que está incluído vs. faturável

**Incluído** — erros da plataforma, dúvidas de utilização, ajuda com utilizadores/atribuições,
apoio à exportação de evidência, atualizações, formação de administrador conforme plano.

**Faturável** — produção de conteúdo fora do âmbito, desenvolvimento à medida, integrações com
sistemas do cliente, formação presencial, migrações que excedam a exportação normal.

**Sempre com preço antes**, por escrito. Sem exceções.

---

## 8. Ligações

- Página pública de suporte: `academy-platforms-site/suporte.html`
- Termos: `academy-platforms-site/termos.html`
- SPEC de conformidade 40h: `~/edenrise-compliance/SPEC.md`
- Protocolo de deploy do site: `DEPLOY.md` no repo do produto
