interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  // Map old statuses for backward compatibility
  const statusMap: Record<string, string> = {
    "accepted": "preparing",
    "served": "ready"
  }
  const mappedStatus = statusMap[status] || status

  const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    preparing: "bg-blue-100 text-blue-800 border border-blue-300",
    ready: "bg-green-100 text-green-800 border border-green-300",
    completed: "bg-gray-100 text-gray-800 border border-gray-300",
    active: "bg-green-100 text-green-800 border border-green-300",
    inactive: "bg-gray-100 text-gray-800 border border-gray-300",
    // Backward compatibility
    accepted: "bg-blue-100 text-blue-800 border border-blue-300",
    served: "bg-green-100 text-green-800 border border-green-300",
  }

  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyles[mappedStatus] || statusStyles.pending}`}>
      {mappedStatus.charAt(0).toUpperCase() + mappedStatus.slice(1)}
    </span>
  )
}
