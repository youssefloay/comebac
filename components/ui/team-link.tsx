import Link from 'next/link'
import { ReactNode } from 'react'

interface TeamLinkProps {
  teamId: string
  teamName: string
  children?: ReactNode
  className?: string
}

export function TeamLink({ teamId, teamName, children, className = "" }: TeamLinkProps) {
  return (
    <Link 
      href={`/public/team/${teamId}`}
      className={`hover:text-green-600 transition-colors cursor-pointer ${className}`}
      title={`Voir les détails de ${teamName}`}
    >
      {children || teamName}
    </Link>
  )
}