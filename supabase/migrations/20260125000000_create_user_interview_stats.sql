-- Create user_interview_stats table for tracking interview progress
-- This table stores aggregate statistics per user for the progress dashboard

create table if not exists public.user_interview_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- Aggregate counts
  total_interviews int default 0,
  coding_count int default 0,
  behavioral_count int default 0,
  system_design_count int default 0,
  
  -- Overall averages (1-5 scale)
  coding_avg_score numeric(3,2),
  behavioral_avg_score numeric(3,2),
  system_design_avg_score numeric(3,2),
  
  -- Coding dimension averages (from codingRubric.ts)
  coding_correctness_avg numeric(3,2),
  coding_time_complexity_avg numeric(3,2),
  coding_space_complexity_avg numeric(3,2),
  coding_code_quality_avg numeric(3,2),
  coding_problem_solving_avg numeric(3,2),
  
  -- Behavioral dimension averages (from behavioralRubric.ts)
  behavioral_star_structure_avg numeric(3,2),
  behavioral_ownership_avg numeric(3,2),
  behavioral_impact_avg numeric(3,2),
  behavioral_leadership_avg numeric(3,2),
  behavioral_decision_making_avg numeric(3,2),
  behavioral_growth_mindset_avg numeric(3,2),
  behavioral_communication_avg numeric(3,2),
  
  -- System Design dimension averages (from systemDesignRubric.ts)
  sd_requirements_avg numeric(3,2),
  sd_architecture_avg numeric(3,2),
  sd_scalability_avg numeric(3,2),
  sd_data_model_avg numeric(3,2),
  sd_tradeoffs_avg numeric(3,2),
  sd_reliability_avg numeric(3,2),
  sd_communication_avg numeric(3,2),
  
  -- Weekly snapshots for trend tracking (JSON array)
  -- Format: [{"week": "2026-W04", "coding": 3.5, "behavioral": 4.0, "system_design": 3.2}, ...]
  weekly_snapshots jsonb default '[]'::jsonb,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Each user has exactly one stats record
  unique(user_id)
);

-- Create index on user_id for fast lookups
create index if not exists idx_user_interview_stats_user_id 
  on public.user_interview_stats(user_id);

-- Enable Row Level Security
alter table public.user_interview_stats enable row level security;

-- Policy: Users can only read their own stats
create policy "Users can view own stats"
  on public.user_interview_stats
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own stats
create policy "Users can insert own stats"
  on public.user_interview_stats
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own stats
create policy "Users can update own stats"
  on public.user_interview_stats
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
drop trigger if exists on_user_interview_stats_updated on public.user_interview_stats;
create trigger on_user_interview_stats_updated
  before update on public.user_interview_stats
  for each row
  execute function public.handle_updated_at();

-- Grant permissions to authenticated users
grant select, insert, update on public.user_interview_stats to authenticated;
