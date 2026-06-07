import { PRIORITY_CONFIG } from '../../lib/utils'

export default function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium
  return (
    <span className={`badge ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}
