"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalculatorForm } from "@/components/calculator-form"
import { TripMap } from "@/components/trip-map"
import { ActiveTrip, TripSummaryCard } from "@/components/active-trip"
import type { TripSummary } from "@/components/active-trip"
import { Fuel, Map, Navigation, ArrowRight, ArrowLeft, Check } from "lucide-react"

interface TripData {
  origin: google.maps.LatLngLiteral
  destination: google.maps.LatLngLiteral
  distance: number
  duration: string
  estimatedCost: number
  estimatedCharge: number
}

type AppStep = "vehicle" | "map" | "active-trip"

const STEPS = [
  { id: "vehicle" as const, label: "Vehicle Info", icon: Fuel },
  { id: "map" as const, label: "Plan Trip", icon: Map },
  { id: "active-trip" as const, label: "Live Trip", icon: Navigation },
]

export default function Home() {
  const [carName, setCarName] = useState("")
  const [carModel, setCarModel] = useState("")
  const [consumption, setConsumption] = useState("")
  const [gasPrice, setGasPrice] = useState("")
  const [profitPercent, setProfitPercent] = useState(50)
  const [tripDistance, setTripDistance] = useState("50")

  // Step state
  const [currentStep, setCurrentStep] = useState<AppStep>("vehicle")

  // Trip state
  const [activeTripData, setActiveTripData] = useState<TripData | null>(null)
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null)

  const calculations = useMemo(() => {
    const consumptionNum = parseFloat(consumption)
    const gasPriceNum = parseFloat(gasPrice)
    const distanceNum = parseFloat(tripDistance)

    const isValid =
      !isNaN(consumptionNum) &&
      !isNaN(gasPriceNum) &&
      !isNaN(distanceNum) &&
      consumptionNum > 0 &&
      gasPriceNum > 0 &&
      distanceNum > 0

    if (!isValid) {
      return {
        costPerKm: 0,
        chargePerKm: 0,
        tripDistance: distanceNum || 50,
        isValid: false,
      }
    }

    const costPerKm = (consumptionNum / 100) * gasPriceNum
    const chargePerKm = costPerKm * (1 + profitPercent / 100)

    return {
      costPerKm,
      chargePerKm,
      tripDistance: distanceNum,
      isValid: true,
    }
  }, [consumption, gasPrice, profitPercent, tripDistance])

  const handleRouteCalculated = useCallback((distanceKm: number) => {
    setTripDistance(distanceKm.toFixed(1))
  }, [])

  const handleStartTrip = useCallback((data: TripData) => {
    setActiveTripData(data)
    setTripSummary(null)
    setCurrentStep("active-trip")
  }, [])

  const handleEndTrip = useCallback((summary: TripSummary) => {
    setTripSummary(summary)
    setActiveTripData(null)
  }, [])

  const handleDismissSummary = useCallback(() => {
    setTripSummary(null)
    setCurrentStep("map")
  }, [])

  const canProceedToMap = calculations.isValid
  const isTripActive = activeTripData !== null

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Fuel className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground text-balance">
                Fuel Cost Calculator
              </h1>
              <p className="text-sm text-muted-foreground">
                Set up your vehicle, plan a trip, and track costs live
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Progress" className="py-4">
            <ol className="flex items-center gap-2 sm:gap-0 sm:justify-between">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isComplete = index < currentStepIndex
                const isCurrent = step.id === currentStep
                const isDisabled =
                  (step.id === "map" && !canProceedToMap) ||
                  (step.id === "active-trip" && !isTripActive && !tripSummary)

                return (
                  <li key={step.id} className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isDisabled && !isTripActive) setCurrentStep(step.id)
                      }}
                      disabled={isDisabled || isTripActive}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium w-full sm:w-auto ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isComplete
                            ? "bg-accent/15 text-accent hover:bg-accent/20"
                            : isDisabled
                              ? "text-muted-foreground/40 cursor-not-allowed"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 ${
                          isCurrent
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : isComplete
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {isComplete ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <StepIcon className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`hidden sm:block flex-1 h-px mx-2 ${
                          isComplete ? "bg-accent" : "bg-border"
                        }`}
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Step 1: Vehicle Info */}
        {currentStep === "vehicle" && (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2 text-foreground">
                  <Fuel className="h-5 w-5 text-primary" />
                  Vehicle & Fuel Details
                </CardTitle>
                <CardDescription>
                  Enter your vehicle info, fuel consumption, and desired profit margin to calculate trip costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalculatorForm
                  carName={carName}
                  setCarName={setCarName}
                  carModel={carModel}
                  setCarModel={setCarModel}
                  consumption={consumption}
                  setConsumption={setConsumption}
                  gasPrice={gasPrice}
                  setGasPrice={setGasPrice}
                />
              </CardContent>
            </Card>

            {/* Summary preview of per-km rates */}
            {calculations.isValid && (
              <Card className="shadow-sm border-2 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">Base fuel cost:</p>
                      <p className="font-heading text-lg font-bold text-foreground">
                        R {calculations.costPerKm.toFixed(2)}
                        <span className="text-xs font-normal text-muted-foreground">/km</span>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set your profit margin in the next step
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Button */}
            <div className="flex justify-end">
              <Button
                size="lg"
                disabled={!canProceedToMap}
                onClick={() => setCurrentStep("map")}
                className="gap-2"
              >
                Continue to Map
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {!canProceedToMap && (
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Fill in consumption and petrol price to continue to the trip planner.
              </p>
            )}
          </div>
        )}

        {/* Step 2: Map + Pricing (pricing shown after pin) */}
        {currentStep === "map" && (
          <div className="space-y-4">
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep("vehicle")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Vehicle Info
            </Button>

            <TripMap
              costPerKm={calculations.costPerKm}
              chargePerKm={calculations.chargePerKm}
              profitPercent={profitPercent}
              setProfitPercent={setProfitPercent}
              consumption={parseFloat(consumption) || 0}
              gasPrice={parseFloat(gasPrice) || 0}
              isValid={calculations.isValid}
              onStartTrip={handleStartTrip}
              onRouteCalculated={handleRouteCalculated}
              carName={carName}
              carModel={carModel}
              tripDistance={calculations.tripDistance}
            />
          </div>
        )}

        {/* Step 3: Active Trip / Summary */}
        {currentStep === "active-trip" && (
          <div className="space-y-4">
            {activeTripData && (
              <ActiveTrip
                tripData={activeTripData}
                costPerKm={calculations.costPerKm}
                chargePerKm={calculations.chargePerKm}
                profitPercent={profitPercent}
                onEndTrip={handleEndTrip}
              />
            )}
            {tripSummary && !activeTripData && (
              <TripSummaryCard
                summary={tripSummary}
                onDismiss={handleDismissSummary}
              />
            )}
          </div>
        )}
      </div>
    </main>
  )
}
