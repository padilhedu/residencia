-- Novos tipos de estado: flashcards (card), gabarito oficial importado (official) e previsão de revisões (forecast)
alter table public.user_state drop constraint user_state_kind_check;
alter table public.user_state add constraint user_state_kind_check
  check (kind in ('star','note','override','plan','settings','topic','errtype','card','official','forecast'));
