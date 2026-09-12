import { FlaskConical } from 'lucide-react'
import { Badge } from '../ui'

/** Every seeded account shows this so sample numbers are never mistaken for real ones. */
export function DemoBadge({ label = '데모 데이터' }: { label?: string }) {
  return (
    <Badge tone="amber">
      <FlaskConical size={10} /> {label}
    </Badge>
  )
}
