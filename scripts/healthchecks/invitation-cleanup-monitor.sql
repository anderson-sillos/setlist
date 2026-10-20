set statement_timeout = '15s';

with target_job as (
  select jobid, active, count(*) over () as job_count
  from cron.job
  where jobname = 'setlist-prune-invitations'
),
latest_run as (
  select job_run.jobid, job_run.status, job_run.end_time
  from cron.job_run_details as job_run
  join target_job on target_job.jobid = job_run.jobid
  order by job_run.start_time desc
  limit 1
),
latest_success as (
  select job_run.end_time
  from cron.job_run_details as job_run
  join target_job on target_job.jobid = job_run.jobid
  where job_run.status = 'succeeded'
    and job_run.end_time is not null
  order by job_run.start_time desc
  limit 1
),
eligible_invitations as (
  select count(*) as row_count
  from public.invitations as invitation
  cross join latest_success
  where least(
      invitation.expires_at,
      coalesce(invitation.revoked_at, 'infinity'::timestamptz),
      coalesce(invitation.used_at, 'infinity'::timestamptz)
    ) < latest_success.end_time - interval '30 days'
    and not exists (
      select 1
      from private.invitation_retention_holds as retention_hold
      where retention_hold.invitation_id = invitation.id
        and retention_hold.hold_until > latest_success.end_time
    )
)
select
  coalesce((select bool_and(active) and bool_and(job_count = 1) from target_job), false),
  coalesce((select status = 'succeeded'
            and end_time > now() - interval '30 hours'
            from latest_run), false),
  coalesce((select row_count = 0 from eligible_invitations), false);
