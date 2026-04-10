import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ListingForm } from '@/components/listings/ListingForm'

export default async function EditListingPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getSessionUser()
  if (!user || user.role !== 'seller') redirect('/seller/register')

  const supabase = createServerSupabaseClient()
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .eq('seller_id', user.id)
    .single()

  if (!listing) notFound()

  return <ListingForm initialData={listing} listingId={params.id} />
}
