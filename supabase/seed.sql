-- Reference data for the Gangnam pilot. Users are created through Supabase Auth
-- (invite with metadata {name, role, store_id}); the trigger in the migration
-- fills the users table. Demo employees below are placeholders until invited.
insert into companies (id, name, vertical) values ('co_bellatrix_demo', 'Bellatrix Demo Retail', 'electronics_retail')
on conflict (id) do nothing;

insert into stores (id, company_id, name, location, vertical, attach_rate_definition, focus_metric)
values ('st_gangnam', 'co_bellatrix_demo', 'Gangnam Flagship Store', '서울 강남구', 'electronics_retail', 'accessory_units_per_transaction', 'attach_rate')
on conflict (id) do nothing;

insert into actions (id, title, description, behaviour_type, intervention_type, target_metric, default_target_count, coaching_text) values
('act_discovery', '니즈 파악 질문 하나 하기', '고객이 주력 상품을 보기 시작하면 "주로 어떤 용도로 쓰실 계획이세요?"처럼 열린 질문을 한 번 던져보세요.', 'discovery', 'action', 'cvr', 5, '"필요하시면 말씀해주세요" 대신 → "주로 어떤 용도로 쓰실 계획이세요?"'),
('act_accessory', '연관 부가상품 하나 제안하기', '고객이 주력 상품을 결정한 직후, 결제 전에 어울리는 부가상품을 하나만 제안해보세요.', 'cross_sell', 'action', 'attach_rate', 3, '결정 직후가 골든타임 — 한 문장.'),
('act_compare', '두 가지 옵션 비교해 보여주기', '고민하는 고객에게 두 제품의 차이를 한 가지 기준으로 짧게 비교해 주세요.', 'recommendation', 'action', 'atv', 3, '기준 하나로 비교하면 결정이 빨라져요.'),
('act_demo', '핵심 기능 하나 직접 시연하기', '설명 대신 고객이 직접 만져보게 하세요. 기능 하나만.', 'demo', 'action', 'cvr', 3, '말로 3문장보다 손으로 10초.'),
('act_closing', '클로징 질문 하나 하기', '충분히 설명했다면 결정을 묻는 질문으로 마무리해 보세요.', 'closing', 'action', 'cvr', 3, '질문 후 3초 기다리기.'),
('mc_accessory', '연관 부가상품 하나 더하기', '고객이 주력 상품을 결정하면, 결제 전에 어울리는 부가상품을 하나만 제안해보세요.', 'cross_sell', 'micro_coaching', 'attach_rate', null, '고객이 주력 상품을 결정한 순간이 제안하기 가장 좋은 타이밍이에요. 한 문장만 더해보세요.'),
('mc_discovery', '첫 질문을 바꿔보기', '"필요하시면 말씀해주세요" 대신 고객의 사용 목적을 묻는 질문으로 시작해보세요.', 'discovery', 'micro_coaching', 'cvr', null, '이렇게 말하는 대신: "필요하시면 말씀해주세요." 이렇게 해보세요: "주로 어떤 용도로 쓰실 계획이세요?"'),
('mq_discovery', '고객 5명에게 니즈 파악 질문 쓰기', '오늘 응대하는 고객 5명에게 열린 질문으로 시작해 보세요.', 'discovery', 'mini_quest', 'cvr', 5, null)
on conflict (id) do nothing;

insert into pilots (id, company_id, store_id, name, start_date, end_date, target_behaviour, target_metric, status)
values ('pl_gangnam_attach', 'co_bellatrix_demo', 'st_gangnam', 'Gangnam Attach Rate Pilot', current_date - 21, current_date + 21, 'cross_sell', 'attach_rate', 'active')
on conflict (id) do nothing;

-- 0002 additions
insert into teams (id, store_id, name, join_code) values ('tm_gangnam', 'st_gangnam', 'Gangnam Flagship 팀', 'GN-4821') on conflict (id) do nothing;
insert into campaigns (id, store_id, name, behaviour_type, target_metric, start_date, end_date, active)
values ('cp_launch_week', 'st_gangnam', '신제품 런칭 주간 — 액세서리 부착', 'cross_sell', 'attach_rate', current_date - 14, current_date + 14, true)
on conflict (id) do nothing;
-- coaching_cards: mirror src/data/coachingCards.ts (insert via the app admin or a one-off script)
