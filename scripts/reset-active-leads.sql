-- Optional re-run: reset all non-terminal leads to qualification funnel start.
-- Terminal legacy outcomes are preserved where already mapped.

update public.leads
set
  lead_status = case
    when lead_status in ('converted', 'failed') then lead_status
    else 'new'
  end,
  lead_status_changed_at = now(),
  loss_reason = case
    when lead_status in ('converted', 'failed') then loss_reason
    else null
  end,
  converted_project_id = case
    when lead_status = 'converted' then converted_project_id
    else null
  end
where lead_status not in ('converted', 'failed');
