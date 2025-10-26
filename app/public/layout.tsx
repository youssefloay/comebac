import type React from "react"
import PublicLayout from "@/components/public/public-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
