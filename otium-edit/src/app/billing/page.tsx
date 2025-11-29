import { getUser } from '@/auth/server'
import { redirect } from 'next/navigation'
import BillingDisplay from './BillingDisplay'

export default async function BillingPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login?redirect=/billing')
  }

  return <BillingDisplay />
}

