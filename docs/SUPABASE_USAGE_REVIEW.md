# Revisão mensal de uso do Supabase

## Procedimento

O responsável fará uma revisão manual por mês na página [Usage do Supabase](https://supabase.com/dashboard/org/_/usage), registrando a organização, o plano, o período de cobrança e a data da conferência. Como o faturamento é por organização, conferir o agregado e considerar os projetos `setlist-dev` e `setlist-prod`; conferir o tamanho do banco separadamente em cada projeto.

Registrar, quando exibidos no painel, uso atual, cota e percentual de:

- tamanho do banco por projeto;
- tráfego de saída (egress) da organização;
- usuários ativos mensais (MAU) da organização;
- armazenamento, invocações de Edge Functions e uso de Realtime;
- ingestão de logs e outras cotas dos serviços habilitados.

Conferir também os relatórios do projeto para estado e desempenho do banco. Uso indisponível ou sem cota visível deve ser anotado como **não disponível**, nunca como zero.

Calcular `uso / cota × 100`. Em **80% ou mais**, registrar um alerta interno como nova pendência no topo de `docs/CODEX_HANDOFF.md` e avaliar redução de uso ou migração de plano conforme `openspec/changes/definir-mvp-setlist/design.md`. O alerta solicita análise; não altera o plano nem autoriza gastos automaticamente. Sem métricas acima do limite, registrar que a revisão foi feita e que nenhum alerta foi acionado.

O Supabase oferece a página de uso e notificações quando cotas são excedidas, mas não configura notificações personalizadas em 80%; o Spend Cap também não oferece limites finos ou aviso em percentuais escolhidos. Portanto, o aviso de 80% deste processo é manual. Consulte [Manage your usage](https://supabase.com/docs/guides/platform/manage-your-usage), [Control your costs](https://supabase.com/docs/guides/platform/cost-control) e [About billing](https://supabase.com/docs/guides/platform/billing-on-supabase). Os valores das cotas devem ser lidos do painel em cada revisão, pois podem mudar.

## Verificação do gatilho

O limite é inclusivo: exatamente 80% aciona alerta. Exemplos de conferência da regra:

| Uso/cota | Percentual | Resultado |
| --- | ---: | --- |
| 399 MB / 500 MB | 79,8% | Sem alerta |
| 400 MB / 500 MB | 80% | Registrar alerta interno |
| 4 GB / 5 GB | 80% | Registrar alerta interno |
| 40.000 / 50.000 MAU | 80% | Registrar alerta interno |

Os exemplos refletem as cotas Free publicadas na data desta revisão; o valor vigente mostrado no painel é a referência operacional.

## Registro mensal

Acrescentar uma linha por revisão, inclusive quando nenhum alerta for acionado:

| Data | Organização/plano | Período de cobrança | Resultado e alertas | Responsável |
| --- | --- | --- | --- | --- |
| 2026-10-08 (parcial) | `anderson-sillos`; plano não disponível pela CLI | Não disponível pela CLI | Estatística técnica `pg_database_size`: `setlist-dev` 13 MB e `setlist-prod` 12 MB. Esse dado não substitui o indicador de uso faturável do painel. Egress, MAU, armazenamento, funções, Realtime, logs, cotas e conclusão do alerta de 80%: não disponíveis pela CLI; pendente conferir no Usage. | Codex (consulta técnica); revisão de cobrança pendente |
