'use client'
import { useEffect } from 'react'
import { initPosthog } from '@/lib/analytics'

export default function PosthogProvider({ children }) {
  useEffect(() => {
    initPosthog()
  }, [])

  return children
}
