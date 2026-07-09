const LABELS = {
  awaiting_resident: 'Awaiting resident',
  awaiting_admin: 'Escalated to admin',
  approved: 'Approved',
  denied: 'Denied',
  on_premises: 'On premises',
  departed: 'Departed',
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved'
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{LABELS[status] || status}</span>;
}
