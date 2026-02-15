"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  MapPin,
  Navigation,
  Route,
  Clock,
  Fuel,
  CircleDollarSign,
  Crosshair,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Gauge,
  Percent,
  ChevronDown,
} from "lucide-react"
import { useGoogleMaps, useGeolocation, useDirections } from "@/hooks/use-google-maps"

interface TripMapProps {
  costPerKm: number
  chargePerKm: number
  profitPercent: number
  setProfitPercent: (v: number) => void
  consumption: number
  gasPrice: number
  isValid: boolean
  carName?: string
  carModel?: string
  tripDistance?: number
  onStartTrip?: (data: {
    origin: google.maps.LatLngLiteral
    destination: google.maps.LatLngLiteral
    distance: number
    duration: string
    estimatedCost: number
    estimatedCharge: number
  }) => void
  onRouteCalculated?: (distanceKm: number) => void
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

function DifferenceIndicator({
  userAmount,
  suggestedAmount,
}: {
  userAmount: number
  suggestedAmount: number
}) {
  const diff = userAmount - suggestedAmount
  const percentDiff =
    suggestedAmount > 0 ? (diff / suggestedAmount) * 100 : 0

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
        <span>
          You charge {formatRand(Math.abs(diff))}/km more (
          {percentDiff.toFixed(1)}% higher)
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-destructive text-sm font-medium">
      <TrendingDown className="h-3.5 w-3.5" />
      <span>
        You charge {formatRand(Math.abs(diff))}/km less (
        {Math.abs(percentDiff).toFixed(1)}% lower)
      </span>
    </div>
  )
}

export function TripMap({
  costPerKm,
  chargePerKm,
  profitPercent,
  setProfitPercent,
  consumption,
  gasPrice,
  isValid,
  carName,
  carModel,
  tripDistance: parentTripDistance,
  onStartTrip,
  onRouteCalculated,
}: TripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const { position, loading: geoLoading, error: geoError } = useGeolocation()
  const { map, isLoaded, error: mapError } = useGoogleMaps(mapContainerRef, {
    center: position || { lat: -26.2041, lng: 28.0473 },
    zoom: 14,
  })
  const {
    distance,
    duration,
    loading: routeLoading,
    error: routeError,
    calculateRoute,
    clearRoute,
  } = useDirections()

  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null)
  const [destinationAddress, setDestinationAddress] = useState<string>("")
  const [originAddress, setOriginAddress] = useState<string>("")
  const [tiersOpen, setTiersOpen] = useState(false)
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const destMarkerRef = useRef<google.maps.Marker | null>(null)
  const pulseMarkerRef = useRef<google.maps.Marker | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const handleSetDestinationRef = useRef<(latLng: google.maps.LatLngLiteral, address: string) => void>(() => {})

  useEffect(() => {
    if (distance > 0 && onRouteCalculated) {
      onRouteCalculated(distance)
    }
  }, [distance, onRouteCalculated])

  // Update user location marker
  useEffect(() => {
    if (!map || !position) return

    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        map,
        position,
        title: "Your Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#1d6ce0",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        zIndex: 10,
      })

      pulseMarkerRef.current = new google.maps.Marker({
        map,
        position,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: "#1d6ce0",
          fillOpacity: 0.15,
          strokeColor: "#1d6ce0",
          strokeWeight: 1,
          strokeOpacity: 0.3,
        },
        zIndex: 5,
      })

      map.setCenter(position)
    } else {
      userMarkerRef.current.setPosition(position)
      pulseMarkerRef.current?.setPosition(position)
    }
  }, [map, position])

  // Reverse geocode user position
  useEffect(() => {
    if (!position || !isLoaded) return

    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setOriginAddress(results[0].formatted_address)
      }
    })
  }, [position, isLoaded])

  // Define handleSetDestination BEFORE any effects that use it
  const handleSetDestination = useCallback(
    (latLng: google.maps.LatLngLiteral, address: string) => {
      setDestination(latLng)
      setDestinationAddress(address)

      if (searchInputRef.current) {
        searchInputRef.current.value = address
      }

      if (map) {
        if (destMarkerRef.current) {
          destMarkerRef.current.setMap(null)
        }

        destMarkerRef.current = new google.maps.Marker({
          map,
          position: latLng,
          title: "Destination",
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#dc2626",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          animation: google.maps.Animation.DROP,
          zIndex: 10,
        })

        if (position) {
          calculateRoute(position, latLng, map)
        }
      }
    },
    [map, position, calculateRoute]
  )

  // Keep the ref in sync so the autocomplete listener always uses the latest callback
  useEffect(() => {
    handleSetDestinationRef.current = handleSetDestination
  }, [handleSetDestination])

  // Set up Places Autocomplete
  useEffect(() => {
    if (!isLoaded || !searchInputRef.current || autocompleteRef.current) return

    autocompleteRef.current = new google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        componentRestrictions: { country: "za" },
        fields: ["geometry", "formatted_address", "name"],
      }
    )

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace()
      if (place?.geometry?.location) {
        const latLng = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }
        handleSetDestinationRef.current(
          latLng,
          place.formatted_address || place.name || "Selected location"
        )
      }
    })
  }, [isLoaded])

  // Click on map to set destination
  useEffect(() => {
    if (!map) return

    const listener = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() }

          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: latLng }, (results, status) => {
            const address =
              status === "OK" && results?.[0]
                ? results[0].formatted_address
                : `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}`
            handleSetDestinationRef.current(latLng, address)
          })
        }
      }
    )

    return () => google.maps.event.removeListener(listener)
  }, [map])

  const handleClearDestination = useCallback(() => {
    setDestination(null)
    setDestinationAddress("")
    if (searchInputRef.current) {
      searchInputRef.current.value = ""
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null)
      destMarkerRef.current = null
    }
    clearRoute()
  }, [clearRoute])

  const handleCenterOnUser = useCallback(() => {
    if (map && position) {
      map.panTo(position)
      map.setZoom(15)
    }
  }, [map, position])

  const estimatedCost = distance * costPerKm
  const estimatedCharge = distance * chargePerKm
  const estimatedProfit = estimatedCharge - estimatedCost

  const vehicleLabel =
    carName && carModel
      ? `${carName} ${carModel}`
      : carName || carModel || "Your Vehicle"

  const handleStartTrip = useCallback(() => {
    if (!position || !destination) return
    onStartTrip?.({
      origin: position,
      destination,
      distance,
      duration,
      estimatedCost,
      estimatedCharge,
    })
  }, [position, destination, distance, duration, estimatedCost, estimatedCharge, onStartTrip])

  if (mapError) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Map Error
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {mapError}
            </p>
            <p className="text-xs text-muted-foreground">
              Make sure your Google Maps API key is valid and has the Maps
              JavaScript API, Directions API, and Places API enabled.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a destination or click on the map..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {destination && (
                <button
                  onClick={handleClearDestination}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear destination"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCenterOnUser}
              disabled={!position}
              className="shrink-0 bg-transparent"
            >
              <Crosshair className="h-4 w-4 mr-2" />
              My Location
            </Button>
          </div>
          {originAddress && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Navigation className="h-3 w-3 text-primary" />
              Current location: {originAddress}
            </p>
          )}
          {geoError && (
            <p className="text-xs text-destructive mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Location access denied. Search or click on map to set destination.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="shadow-sm overflow-hidden">
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[400px] sm:h-[500px] bg-secondary"
          />
          {(!isLoaded || geoLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {geoLoading ? "Getting your location..." : "Loading map..."}
                </p>
              </div>
            </div>
          )}
          {routeLoading && (
            <div className="absolute top-3 left-3 bg-card/90 backdrop-blur rounded-lg px-3 py-2 shadow-md">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-foreground">
                  Calculating route...
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Route Info, Pricing & Start Trip -- shown only after pinning destination */}
      {destination && distance > 0 && isValid && (
        <>
          {/* Trip Estimate Card */}
          <Card className="shadow-sm border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2 text-foreground">
                <Route className="h-5 w-5 text-primary shrink-0" />
                Trip Estimate
              </CardTitle>
              <CardDescription className="text-sm truncate">
                {destinationAddress}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Route Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <Route className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-heading font-bold text-foreground">
                      {distance.toFixed(1)} km
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-heading font-bold text-foreground">
                      {duration}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <Fuel className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Fuel Cost
                  </p>
                  <p className="font-heading text-base font-bold text-foreground">
                    R {estimatedCost.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary text-primary-foreground">
                  <CircleDollarSign className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-xs opacity-80 mb-0.5">Charge</p>
                  <p className="font-heading text-base font-bold">
                    R {estimatedCharge.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-accent text-accent-foreground">
                  <CircleDollarSign className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-xs opacity-80 mb-0.5">Profit</p>
                  <p className="font-heading text-base font-bold">
                    R {estimatedProfit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Profit Margin Slider */}
              <div className="p-4 rounded-lg bg-secondary space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-foreground text-sm font-medium">
                    <Percent className="h-4 w-4 text-primary" />
                    Profit Margin
                  </Label>
                  <span className="text-xl font-heading font-bold text-primary">
                    {profitPercent}%
                  </span>
                </div>
                <Slider
                  value={[profitPercent]}
                  onValueChange={(v) => setProfitPercent(v[0])}
                  min={0}
                  max={200}
                  step={1}
                  className="py-1"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                  <span>150%</span>
                  <span>200%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Rate: R {chargePerKm.toFixed(2)}/km</span>
                <Badge variant="secondary">{profitPercent}% markup</Badge>
              </div>

              <Button className="w-full" size="lg" onClick={handleStartTrip}>
                <Navigation className="h-5 w-5 mr-2" />
                Start Trip
              </Button>

              {routeError && (
                <p className="text-xs text-destructive text-center">
                  {routeError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Full Pricing Breakdown */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="text-center pb-3 border-b border-border">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  Pricing for
                </p>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  {vehicleLabel}
                </h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Per-km Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 rounded-lg bg-secondary">
                  <Fuel className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">
                    Fuel Cost/km
                  </p>
                  <p className="font-heading text-lg font-bold text-foreground">
                    {formatRand(costPerKm)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary text-primary-foreground">
                  <CircleDollarSign className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-xs opacity-80 mb-1">Your Charge/km</p>
                  <p className="font-heading text-lg font-bold">
                    {formatRand(chargePerKm)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-accent text-accent-foreground">
                  <TrendingUp className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-xs opacity-80 mb-1">Profit/km</p>
                  <p className="font-heading text-lg font-bold">
                    {formatRand(chargePerKm - costPerKm)}
                  </p>
                </div>
              </div>

              {/* Trip Breakdown */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-base">
                    Trip Breakdown ({distance.toFixed(1)} km)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Fuel Cost
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatRand(estimatedCost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Charge ({profitPercent}% markup)
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatRand(estimatedCharge)}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-foreground">
                        Total Profit
                      </span>
                      <span className="font-heading text-lg font-bold text-accent">
                        {formatRand(estimatedProfit)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suggested Pricing Tiers (Collapsible) */}
              <Collapsible open={tiersOpen} onOpenChange={setTiersOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full py-2 px-1 group"
                  >
                    <h4 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Suggested Pricing Tiers
                    </h4>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        tiersOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {SUGGESTED_TIERS.map((tier) => {
                    const suggestedCharge =
                      costPerKm * (1 + tier.percent / 100)
                    const suggestedTripTotal = suggestedCharge * distance
                    const isUserMatch =
                      Math.abs(profitPercent - tier.percent) < 5

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
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-heading font-bold text-foreground">
                                  {tier.label}
                                </span>
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
                              <p className="text-xs text-muted-foreground mb-2">
                                {tier.description}
                              </p>
                              <DifferenceIndicator
                                userAmount={chargePerKm}
                                suggestedAmount={suggestedCharge}
                              />
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-heading text-lg font-bold text-foreground">
                                {formatRand(suggestedCharge)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                per km
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Trip: {formatRand(suggestedTripTotal)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </>
      )}

      {/* Destination pinned but calculator not valid */}
      {destination && distance > 0 && !isValid && (
        <Card className="shadow-sm">
          <CardContent className="p-6 text-center">
            <Gauge className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Go back and enter vehicle and fuel details to see cost estimates
              for this route.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Hint when no destination */}
      {!destination && isLoaded && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Click anywhere on the map or search above to pin your destination.
            The route, cost estimate, and full pricing breakdown will appear
            automatically.
          </p>
        </div>
      )}
    </div>
  )
}
