create table if not exists public.education_articles (
  slug text primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('study', 'psychology', 'risk', 'premium')),
  level text not null,
  read_time text not null,
  access text not null default 'Free' check (access in ('Free', 'Members')),
  published_date text not null,
  cover_title text not null,
  cover_subtitle text not null,
  content text not null,
  is_published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.education_articles enable row level security;

drop policy if exists "Anyone can read published education articles" on public.education_articles;
create policy "Anyone can read published education articles"
on public.education_articles
for select
using (is_published = true or public.is_admin());

drop policy if exists "Admins can insert education articles" on public.education_articles;
create policy "Admins can insert education articles"
on public.education_articles
for insert
with check (public.is_admin());

drop policy if exists "Admins can update education articles" on public.education_articles;
create policy "Admins can update education articles"
on public.education_articles
for update
using (public.is_admin())
with check (public.is_admin());



drop policy if exists "Admins can delete education articles" on public.education_articles;
create policy "Admins can delete education articles"
on public.education_articles
for delete
using (public.is_admin());

drop trigger if exists education_articles_set_updated_at on public.education_articles;
create trigger education_articles_set_updated_at
before update on public.education_articles
for each row
execute function public.set_updated_at();

insert into public.education_articles (
  slug,
  title,
  description,
  category,
  level,
  read_time,
  access,
  published_date,
  cover_title,
  cover_subtitle,
  content,
  is_published,
  display_order
)
values
  (
    'liquidity-buy-side-sell-side-stop-hunts',
    'Liquidity: Buy Side, Sell Side, and Stop Hunts',
    'Identify where liquidity rests and how price often moves before real expansion.',
    'study',
    'Core',
    '20 min read',
    'Free',
    'September 5, 2026',
    'Liquidity Map',
    'Where stops become fuel',
    $$Liquidity is the fuel that allows price to move. In practical terms, liquidity often sits around obvious highs, obvious lows, equal highs, equal lows, and clean consolidation ranges where many traders place stops or breakout orders.

Buy side liquidity usually rests above highs. Sell side liquidity usually rests below lows. When price pushes into those areas, it can trigger orders, create volatility, and then either continue or reverse depending on the higher timeframe context.

The mistake many traders make is entering only because liquidity was taken. A liquidity sweep is not automatically a trade. It becomes useful when it appears in the right location, at the right time, and after price gives confirmation that the sweep has served its purpose.

Before using liquidity in a setup, mark the draw on liquidity, note the session timing, and define what would prove your idea wrong. That keeps liquidity analysis from becoming a random entry signal.$$,
    true,
    1
  ),
  (
    'fair-value-gaps-and-imbalance-explained',
    'Fair Value Gaps and Imbalance Explained Simply',
    'Use imbalance as context, not as a blind entry button.',
    'study',
    'Core',
    '15 min read',
    'Free',
    'September 5, 2026',
    'Imbalance',
    'Trade context before entries',
    $$A fair value gap is an area where price moved aggressively enough to leave an inefficient delivery between candles. Traders watch these zones because price can return to rebalance part of that move before continuing.

The important part is context. A fair value gap near a strong draw on liquidity or inside a clear higher timeframe bias is more meaningful than a random gap in the middle of noise.

Do not treat every gap as a buy or sell button. First ask where price is likely trying to go, what liquidity has already been taken, and whether the current session timing supports continuation.

A cleaner model is simple: identify bias, wait for displacement, mark the imbalance, then require confirmation and clear invalidation before taking risk.$$,
    true,
    2
  ),
  (
    'how-to-backtest-without-lying-to-yourself',
    'How to Backtest Without Lying to Yourself',
    'Build a sample size, write rules, and review results with discipline.',
    'study',
    'Study',
    '16 min read',
    'Free',
    'September 5, 2026',
    'Backtest Rules',
    'Proof before confidence',
    $$Backtesting is not about finding perfect screenshots. It is about testing whether a repeatable idea holds up across enough examples to deserve your attention.

Start by writing the rule set before opening the chart. Define market, session, timeframe, entry condition, stop placement, target logic, and invalidation. If the rules are not written, the test becomes emotional.

A good backtest includes wins, losses, breakeven trades, missed trades, and examples where the setup looked almost right but failed. Those details help you understand the real behavior of the model.

Track screenshots and notes. After a sample size, review the data honestly. The goal is not to prove that you are right. The goal is to discover what is worth trading with real risk.$$,
    true,
    3
  ),
  (
    'weekly-review-template',
    'Weekly Review Template',
    'A simple checklist for reviewing screenshots, emotions, mistakes, and execution quality.',
    'study',
    'PDF',
    'Download',
    'Members',
    'September 5, 2026',
    'Weekly Review',
    'Grade the process',
    $$A weekly review helps you see patterns that are invisible during the trading day. One trade can feel emotional. A full week shows behavior.

Review each trade by plan quality, execution quality, risk control, emotional state, and whether you respected the invalidation. Do not only mark profit or loss.

Then group the week into themes: best setups, worst decisions, repeated mistakes, missed opportunities, and one rule to focus on next week.

The goal is simple: make the next week cleaner than the last one. Progress comes from removing repeated mistakes, not from adding more indicators.$$,
    true,
    4
  ),
  (
    'trading-psychology-patience-fear-overtrading',
    'Trading Psychology: Patience, Fear, and Overtrading',
    'Recognize the emotional loops that destroy consistency and learn how to reset.',
    'psychology',
    'Mindset',
    '14 min read',
    'Free',
    'September 5, 2026',
    'Mindset Reset',
    'Patience before execution',
    $$Most trading mistakes are not caused by a lack of information. They are caused by reacting too quickly when fear, greed, boredom, or revenge takes control.

Patience is not passive. It is the skill of waiting for your exact conditions instead of forcing a trade because the market is moving without you.

Fear often appears after a loss or before a high quality entry. Overtrading often appears after a win, when confidence turns into urgency. Both problems are solved by rules that are written before the session starts.

A strong trader learns to pause, breathe, check the plan, and accept that no trade is better than a trade taken from emotion.$$,
    true,
    5
  ),
  (
    'risk-management-position-sizing-daily-loss-limits',
    'Risk Management: Position Sizing and Daily Loss Limits',
    'Protect the account first, then focus on execution quality.',
    'risk',
    'Risk',
    '17 min read',
    'Free',
    'September 5, 2026',
    'Risk First',
    'Survive every session',
    $$Risk management is the part of trading that keeps you in the game long enough to improve. A good setup means very little if the risk is too large for your account or your emotions.

Position size should be calculated before entry. Your stop loss, account size, and risk percentage decide the size, not confidence or excitement.

A daily loss limit protects you from the worst version of yourself. Once you hit the limit, the session is over. This rule is not punishment. It is protection.

The best traders are not the ones who never lose. They are the ones who can take losses without losing control of the account.$$,
    true,
    6
  ),
  (
    'daily-bias-simple-pre-market-plan',
    'Daily Bias: Building a Simple Pre-Market Plan',
    'Create a repeatable process for mapping the day before the New York session starts.',
    'premium',
    'Advanced',
    '24 min read',
    'Members',
    'September 5, 2026',
    'Daily Bias',
    'Prepare before the bell',
    $$A daily bias gives structure to the session. It does not predict the future. It helps you decide what you are willing to trade and what you should ignore.

Start with higher timeframe direction, key liquidity, previous day high and low, session highs and lows, and major news. Then decide which side of the market has the cleaner story.

A good pre-market plan also includes conditions that would cancel your bias. If price does something that invalidates the idea, you do not argue with it. You update or step aside.

The purpose of planning is to reduce decisions during live price action. Less improvisation usually means cleaner execution.$$,
    true,
    7
  ),
  (
    'entry-model-confirmation-invalidation-risk',
    'Entry Model: Confirmation, Invalidation, and Risk',
    'Connect setup quality with clear risk so every trade has a reason and an exit point.',
    'premium',
    'Advanced',
    '28 min read',
    'Members',
    'September 5, 2026',
    'Entry Model',
    'Reason, risk, invalidation',
    $$An entry model is a repeatable sequence. It should tell you what must happen before entry, where the trade is wrong, and how risk will be managed after entry.

Confirmation can come from displacement, a structural shift, a clean retest, or another rule inside your model. The exact rule matters less than consistency.

Invalidation is the price or condition that proves the idea is no longer valid. Without invalidation, a trader can keep moving the stop emotionally and turn a small loss into a large one.

When confirmation and invalidation are clear, execution becomes calmer because the trade has boundaries before money is at risk.$$,
    true,
    8
  ),
  (
    'pre-market-checklist',
    'Pre-Market Checklist',
    'Map bias, liquidity, news, key levels, and the setups you are allowed to take.',
    'premium',
    'PDF',
    'Download',
    'Members',
    'September 5, 2026',
    'Checklist',
    'Session rules before entries',
    $$A pre-market checklist keeps your attention on the few things that matter before volatility starts. It should be short enough to use every day.

Mark higher timeframe direction, key liquidity, major levels, expected session, news risk, and the setups that are allowed for the day.

Also write what you are not allowed to do. For many traders, the no-trade rules are more valuable than the entry rules.

The checklist is complete when you know where you want price to trade, what confirmation you need, and what would make you stay flat.$$,
    true,
    9
  ),
  (
    'trade-recap-framework',
    'Trade Recap Framework',
    'Grade every trade by plan, execution, risk, and emotional control.',
    'premium',
    'Review',
    '22 min read',
    'Members',
    'September 5, 2026',
    'Trade Recap',
    'Review the decision',
    $$A trade recap should judge the decision, not only the result. A winning trade can be badly executed, and a losing trade can still be a correct decision.

Screenshot the before, entry, management, and exit. Then write the reason for entry, risk taken, emotional state, and whether the trade followed the plan.

Grade each trade with simple categories: A for clean plan and execution, B for minor mistakes, C for emotional or unclear execution, and D for rule breaking.

Over time, your goal is to take more A and B trades, reduce C trades, and eliminate D trades completely.$$,
    true,
    10
  )
on conflict (slug) do nothing;
