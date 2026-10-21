set statement_timeout = '15s';

with target_job as (
  select jobid, active, count(*) over () as job_count
  from cron.job
  where jobname = 'setlist-prune-auth-audit-logs'
),
run_days as (
  select
    (job_run.start_time at time zone 'UTC')::date as run_date,
    bool_or(job_run.status = 'succeeded') as succeeded
  from cron.job_run_details as job_run
  join target_job on target_job.jobid = job_run.jobid
  where job_run.start_time >= now() - interval '31 days'
  group by (job_run.start_time at time zone 'UTC')::date
),
first_run as (
  select min(run_date) as first_run_date
  from run_days
),
expected_days as (
  select expected.day::date as run_date
  from first_run
  cross join lateral generate_series(
    greatest(
      ((now() at time zone 'UTC')::date - 30)::timestamp,
      first_run.first_run_date::timestamp
    ),
    ((now() at time zone 'UTC')::date - 1)::timestamp,
    interval '1 day'
  ) as expected(day)
),
successful_day_count as (
  select count(*) as successful_count
  from expected_days
  join run_days using (run_date)
  where run_days.succeeded
),
expected_day_count as (
  select count(*) as expected_count from expected_days
),
latest_run as (
  select job_run.status, job_run.end_time
  from cron.job_run_details as job_run
  join target_job on target_job.jobid = job_run.jobid
  order by job_run.start_time desc
  limit 1
),
expired_entries as (
  select count(*) as row_count
  from auth.audit_log_entries as audit_entry
  where audit_entry.created_at < now() - interval '30 days'
    and not exists (
      select 1
      from private.auth_audit_retention_holds as retention_hold
      where retention_hold.audit_log_entry_id = audit_entry.id
        and retention_hold.hold_until > now()
    )
),
stale_holds as (
  select count(*) as row_count
  from private.auth_audit_retention_holds as retention_hold
  where retention_hold.hold_until <= now()
    or not exists (
      select 1
      from auth.audit_log_entries as audit_entry
      where audit_entry.id = retention_hold.audit_log_entry_id
    )
)
select
  coalesce((select bool_and(active) and bool_and(job_count = 1) from target_job), false)
    as job_active_and_unique,
  coalesce((select status = 'succeeded'
            and end_time > now() - interval '36 hours'
            from latest_run), false)
    as latest_run_succeeded,
  coalesce((select successful_count = expected_count
            from successful_day_count cross join expected_day_count), false)
    as expected_daily_runs_succeeded,
  coalesce((select row_count = 0 from expired_entries), false)
    as no_unheld_expired_entries,
  coalesce((select row_count = 0 from stale_holds), false)
    as no_expired_or_orphaned_holds;
