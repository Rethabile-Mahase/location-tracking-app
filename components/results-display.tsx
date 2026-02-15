"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Fuel, CircleDollarSign, Gauge } from "lucide-react"

interface ResultsDisplayProps {
  carName: string
  carModel: string
  costPerKm: number
  chargePerKm: number
  profitPercent: number
  tripDistance: number
  isValid: boolean
}

interface SuggestedTier {
  label: string
  percent: number
  description: string
  badge: "Economy" | "Standard" | "Premium"
}

const SUGGESTED_TIERS: SuggestedTier[] = [
  {
    label: "Economy",
    percent: 25,
    description: "Competitive pricing to attract volume",
    badge: "Economy",
  },
  {
    label: "Standard",
    percent: 50,
    description: "Balanced margin for sustainable business",
    badge: "Standard",
  },
  {
    label: "Premium",
    percent: 80,
    description: "Higher margin for premium service",
    badge: "Premium",
  },
]

function formatRand(amount: number): string {
  return `R ${amount.toFixed(2)}`
}

function DifferenceIndicator({ userAmount, suggestedAmount }: { userAmount: number; suggestedAmount: number }) {
  const diff = userAmount - suggestedAmount
  const percentDiff = suggestedAmount > 0 ? ((diff / suggestedAmount) * 100) : 0

  if (Math.abs(diff) < 0.01) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="h-3.5 w-3.5" />
        <span>Same as your price</span>
      </div>
    )
  }

  if (diff > 0) {
    return (
      <div className="flex items-center gap-1 text-accent text-sm font-medium">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>You charge {formatRand(Math.abs(diff))}/km more ({percentDiff.toFixed(1)}% higher)</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-destructive text-sm font-medium">
      <TrendingDown className="h-3.5 w-3.5" />
      <span>You charge {formatRand(Math.abs(diff))}/km less ({Math.abs(percentDiff).toFixed(1)}% lower)</span>
    </div>
  )
}

export function ResultsDisplay({
  carName,
  carModel,
  costPerKm,
  chargePerKm,
  profitPercent,
  tripDistance,
  isValid,
}: ResultsDisplayProps) {
  if (!isValid) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-3 px-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Gauge className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Enter Your Details</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Fill in the vehicle information and fuel costs to see your pricing breakdown and suggestions.
          </p>
        </div>
      </div>
    )
  }

  const vehicleLabel = carName && carModel
    ? `${carName} ${carModel}`
    : carName || carModel || "Your Vehicle"

  const totalFuelCost = costPerKm * tripDistance
  const totalCharge = chargePerKm * tripDistance
  const totalProfit = totalCharge - totalFuelCost

  return (
    <div className="space-y-6">
      {/* Vehicle Summary */}
      <div className="text-center pb-4 border-b border-border">
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Pricing for</p>
        <h3 className="font-heading text-xl font-bold text-foreground">{vehicleLabel}</h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-4 rounded-lg bg-secondary">
          <Fuel className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-1">Fuel Cost/km</p>
          <p className="font-heading text-lg font-bold text-foreground">{formatRand(costPerKm)}</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-primary text-primary-foreground">
          <CircleDollarSign className="h-5 w-5 mx-auto mb-2" />
          <p className="text-xs opacity-80 mb-1">Your Charge/km</p>
          <p className="font-heading text-lg font-bold">{formatRand(chargePerKm)}</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-accent text-accent-foreground">
          <TrendingUp className="h-5 w-5 mx-auto mb-2" />
          <p className="text-xs opacity-80 mb-1">Profit/km</p>
          <p className="font-heading text-lg font-bold">{formatRand(chargePerKm - costPerKm)}</p>
        </div>
      </div>

      {/* Trip Breakdown */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">
            Trip Breakdown ({tripDistance} km)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Fuel Cost</span>
              <span className="font-semibold text-foreground">{formatRand(totalFuelCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Charge ({profitPercent}% markup)</span>
              <span className="font-semibold text-foreground">{formatRand(totalCharge)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Total Profit</span>
              <span className="font-heading text-lg font-bold text-accent">{formatRand(totalProfit)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Pricing Tiers */}
      <div>
        <h4 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Suggested Pricing Tiers
        </h4>
        <div className="space-y-3">
          {SUGGESTED_TIERS.map((tier) => {
            const suggestedCharge = costPerKm * (1 + tier.percent / 100)
            const suggestedTripTotal = suggestedCharge * tripDistance
            const isUserMatch = Math.abs(profitPercent - tier.percent) < 5

            return (
              <Card
                key={tier.label}
                className={`transition-all ${
                  isUserMatch
                    ? "border-2 border-primary shadow-md"
                    : "border border-border hover:border-primary/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-heading font-bold text-foreground">{tier.label}</span>
                        <Badge
                          variant={isUserMatch ? "default" : "secondary"}
                          className={
                            tier.badge === "Economy"
                              ? "bg-chart-2 text-accent-foreground border-transparent"
                              : tier.badge === "Premium"
                                ? "bg-chart-1 text-primary-foreground border-transparent"
                                : ""
                          }
                        >
                          {tier.percent}% markup
                        </Badge>
                        {isUserMatch && (
                          <Badge className="bg-accent text-accent-foreground border-transparent">
                            Your pick
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{tier.description}</p>
                      <DifferenceIndicator userAmount={chargePerKm} suggestedAmount={suggestedCharge} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-heading text-lg font-bold text-foreground">{formatRand(suggestedCharge)}</p>
                      <p className="text-xs text-muted-foreground">per km</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Trip: {formatRand(suggestedTripTotal)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
