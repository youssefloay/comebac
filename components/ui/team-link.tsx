import Link from 'next/link'
import { ReactNode, CSSProperties } from 'react'

interface TeamLinkProps {
  teamId: string
  teamName: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export function TeamLink({ teamId, teamName, children, className = "", style }: TeamLinkProps) {
  return (
    <Link 
      href={`/public/team/${teamId}`}
      className={`transition-colors cursor-pointer ${className}`}
      style={style}
      title={`Voir les détails de ${teamName}`}
    >
      {children || teamName}
    </Link>
  )
}