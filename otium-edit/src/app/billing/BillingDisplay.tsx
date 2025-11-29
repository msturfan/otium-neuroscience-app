'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PricingTier = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
  savings?: string
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 20 notes',
      'Basic note creation and editing',
      'Basic search functionality',
      'Voice input (5 min/day)',
      'AI suggestions (10 queries/month)',
      'Standard support (48-hour response)',
      'Basic export (PDF only)',
      '100MB storage',
      'Daily quotes',
      'Calendar view (read-only)',
    ],
    cta: 'Current Plan',
  },
  {
    name: 'Monthly',
    price: '$17',
    period: 'per month',
    description: 'For power users and professionals',
    features: [
      'Unlimited notes',
      'Advanced note organization',
      'Advanced search with filters',
      'Unlimited voice input',
      'Unlimited AI suggestions',
      'Priority support (24-hour response)',
      'Advanced export (PDF, Markdown, DOCX, JSON)',
      'Import from other note apps',
      '10GB storage',
      'Version history (30 days)',
      'Analytics and insights',
      'Custom themes and page customization',
      'Link sharing and collaboration',
      'Wiki mode',
      'Early access to new features',
    ],
    cta: 'Upgrade to Monthly',
  },
  {
    name: 'Yearly',
    price: '$180',
    period: 'per year',
    description: 'Best value for long-term users',
    features: [
      'Everything in Monthly',
      'Priority support (12-hour response)',
      '50GB storage',
      'Extended version history (1 year)',
      'Advanced analytics and insights',
      'API access',
      'Custom integrations',
      'Team collaboration features',
      'Dedicated account manager',
      'Annual usage reports',
    ],
    cta: 'Upgrade to Yearly',
    popular: true,
    savings: 'Save $24/year ($2/month)',
  },
]

function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <Card
      className={cn(
        'relative flex flex-col',
        tier.popular && 'border-primary shadow-lg'
      )}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{tier.name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">{tier.price}</span>
          {tier.period !== 'forever' && (
            <span className="text-muted-foreground text-sm">
              {' '}
              / {tier.period}
            </span>
          )}
        </div>
        {tier.savings && (
          <Badge variant="secondary" className="mt-2">
            {tier.savings}
          </Badge>
        )}
        <CardDescription className="mt-2">{tier.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={tier.popular ? 'default' : 'outline'}
          disabled={tier.name === 'Free'}
        >
          {tier.cta}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function BillingDisplay() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Select the plan that best fits your needs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground text-sm">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </div>
  )
}

