# Acordo de Subcontratação de Dados (DPA) — MINUTA

> **⚠️ MINUTA PARA REVISÃO JURÍDICA — não assinar sem validação por advogado.**
> Preparada 2026-07-24 a partir do funcionamento real da plataforma (ver `GDPR-COMPLIANCE.md`).
> Campos entre `[colchetes]` são preenchidos por contrato.

Celebrado nos termos do art. 28.º do RGPD (Regulamento (UE) 2016/679), entre:

**Responsável pelo Tratamento:** `[EMPRESA CLIENTE]`, NIPC `[…]` («Cliente»)
**Subcontratante:** `[MERIDANTE / ENTIDADE OPERADORA]`, NIPC `[…]` («Operador»)

## 1 · Objeto e duração
O Operador disponibiliza e opera uma academia de formação digital em marca branca («Plataforma»)
e trata dados pessoais por conta do Cliente, exclusivamente para as finalidades do Anexo A,
enquanto vigorar o contrato principal de subscrição.

## 2 · Natureza e finalidade do tratamento
Alojamento e operação da Plataforma; autenticação de utilizadores; registo de progresso formativo;
produção do registo de evidência de formação (encadeado criptograficamente, imutável para clientes);
geração de documentação de conformidade (Código do Trabalho art. 131.º; Regulamento (UE) 2024/1689
art. 4.º); diagnóstico técnico.

## 3 · Categorias de titulares e de dados
**Titulares:** trabalhadores/formandos do Cliente; gestores/administradores designados.
**Dados:** identificação (nome, email, foto opcional); progresso formativo e resultados; registo de
eventos de aprendizagem com datas; texto livre introduzido pelo titular (notas, compromissos,
mensagens de comunidade); confirmações de aplicação por chefias; diagnósticos de erro.
**Não são tratadas categorias especiais de dados.**

## 4 · Obrigações do Operador
a) Tratar os dados apenas mediante **instruções documentadas** do Cliente, incluindo quanto a
transferências para países terceiros;
b) Garantir que as pessoas autorizadas assumiram **compromisso de confidencialidade**;
c) Aplicar as **medidas técnicas e organizativas** do Anexo B (art. 32.º);
d) Respeitar as condições dos n.ºs 2 e 4 do art. 28.º quanto a **subcontratantes ulteriores**:
   o Cliente autoriza os listados no Anexo C; o Operador notifica alterações com antecedência
   razoável, podendo o Cliente opor-se;
e) **Assistir o Cliente** na resposta a pedidos de exercício de direitos (a Plataforma disponibiliza
   exportação e retificação em self-service; o apagamento completo é executado pelo Operador no
   prazo máximo de **30 dias**, com recibo de apagamento);
f) Assistir o Cliente no cumprimento dos arts. 32.º a 36.º, atenta a natureza do tratamento;
g) Notificar o Cliente de **violações de dados pessoais** sem demora injustificada e o mais tardar
   **72 horas** após delas ter conhecimento;
h) Consoante a escolha do Cliente, **apagar ou devolver** todos os dados pessoais no termo do
   contrato (exportação em formato JSON aberto, verificável de forma independente), salvo
   conservação exigida por lei;
i) Disponibilizar a informação necessária para demonstrar o cumprimento e permitir **auditorias**,
   com pré-aviso razoável e sem acesso a dados de outros clientes.

## 5 · Instrução sobre registos com obrigação legal de conservação
O Cliente reconhece que os registos de formação podem estar sujeitos a prazos legais de conservação
(designadamente Código do Trabalho). Cabe ao Cliente, enquanto Responsável, indicar o prazo aplicável;
na ausência de indicação, aplica-se o apagamento no termo do contrato (cláusula 4-h).

## Anexo A — Detalhe do tratamento
Finalidades: formação e-learning; prova de formação; conformidade legal do empregador.
Localização dos dados: região UE (`europe-west1`) para instâncias novas. `[Confirmar região da
instância específica.]`

## Anexo B — Medidas técnicas e organizativas
- Regras de segurança aplicadas na base de dados (isolamento por inquilino; leituras autenticadas);
- Registo de evidência **imutável para clientes** (create-only): nem o titular nem o Cliente podem
  alterar ou apagar eventos — apenas o Operador, mediante pedido válido de apagamento;
- Encadeamento criptográfico (SHA-256) + ancoragem temporal pública com resumos cegos (sem dados
  pessoais por construção);
- Transporte cifrado (TLS); autenticação Google/email com verificação; sem cookies de rastreio nem
  analytics de terceiros;
- Ferramenta de apagamento completo com recibo (`gdpr-erase.py`), prazo máximo 30 dias.

## Anexo C — Subcontratantes ulteriores autorizados
| Entidade | Serviço | Local |
|---|---|---|
| Google Ireland Ltd (Firebase) | autenticação e base de dados | UE (região da instância) |
| GitHub, Inc. (Pages) | alojamento de ficheiros estáticos da aplicação | global (sem dados pessoais em repouso) |
| Google (Fonts) | tipos de letra | ver plano de auto-alojamento |
| Vimeo, Inc. / Google (YouTube) | reprodução de vídeo em modo de privacidade | EUA/global (conteúdo, não dados de conta) |
