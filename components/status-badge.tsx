interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    preparing: "bg-blue-100 text-blue-800 border border-blue-300",
    ready: "bg-green-100 text-green-800 border border-green-300",
    completed: "bg-gray-100 text-gray-800 border border-gray-300",
    active: "bg-green-100 text-green-800 border border-green-300",
    inactive: "bg-gray-100 text-gray-800 border border-gray-300",
  }

  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyles[status] || statusStyles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
