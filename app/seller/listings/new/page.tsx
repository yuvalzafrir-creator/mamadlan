import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ListingForm } from '@/components/listings/ListingForm'

export default async function NewListingPage() {
  const user = await getSessionUser()
  if (!user || user.role !== 'seller') redirect('/seller/register')
  return <ListingForm />
}
