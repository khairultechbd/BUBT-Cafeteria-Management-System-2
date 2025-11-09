import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon?: React.ReactNode
  variant?: "default" | "success" | "warning" | "info"
}

export function StatCard({ title, value, description, icon, variant = "default" }: StatCardProps) {
  const variantClasses = {
    default: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-purple-50 border-purple-200",
  }

  return (
    <Card className={`${variantClasses[variant]} border-2`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon && <div className="text-2xl">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
