import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SellerWizard } from '@/components/onboarding/SellerWizard'
import { redirect } from 'next/navigation'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { step?: string; success?: string }
}) {
  const user = await getSessionUser()
  if (!user || user.role !== 'seller') redirect('/seller/register')

  let initialStep = user.onboarding_step || 1

  if (searchParams.success === 'true' && initialStep === 2) {
    const supabase = createServerSupabaseClient()
    await supabase.from('profiles').update({ onboarding_step: 3 }).eq('id', user.id)
    initialStep = 3
  }

  return <SellerWizard initialStep={initialStep} />
}
