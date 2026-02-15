"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Navigation,
  Route,
  Clock,
  Fuel,
  CircleDollarSign,
  Square,
  MapPin,
  TrendingUp,
  Timer,
} from "lucide-react"
import { useGoogleMaps, useGeolocation } from "@/hooks/use-google-maps"

// ...existing code...

interface TripData {
  origin: google.maps.LatLngLiteral
  destination: google.maps.LatLngLiteral
  distance: number
  duration: string
  estimatedCost: number
  estimatedCharge: number
}

interface ActiveTripProps {
  tripData: TripData
  costPerKm: number
  chargePerKm: number
  profitPercent: number
  onEndTrip: (summary: TripSummary) => void
}

export interface TripSummary {
  distanceTraveled: number
  elapsedTime: string
  fuelCost: number
  totalCharge: number
  profit: number
  estimatedDistance: number
  estimatedCharge: number
}

function formatElapsed(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`
  }
  return `${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`
}

function haversineDistance(
  p1: google.maps.LatLngLiteral,
  p2: google.maps.LatLngLiteral
): number {
  const R = 6371
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function ActiveTrip({
  tripData,
  costPerKm,
  chargePerKm,
  profitPercent,
  onEndTrip,
}: ActiveTripProps) {
  // DirectionsRenderer for route
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([])
  const [isOffRoute, setIsOffRoute] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const { position } = useGeolocation()
  const { map, isLoaded } = useGoogleMaps(mapContainerRef, {
    center: tripData.origin,
    zoom: 14,
  })
  const [distanceTraveled, setDistanceTraveled] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [pathPoints, setPathPoints] = useState<google.maps.LatLngLiteral[]>([
    tripData.origin,
  ])
  const prevPositionRef = useRef<google.maps.LatLngLiteral>(tripData.origin)
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const destMarkerRef = useRef<google.maps.Marker | null>(null)
  const pathLineRef = useRef<google.maps.Polyline | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // Render route when routePath changes
  useEffect(() => {
    if (!map || !tripData.origin || !tripData.destination) return
    if (routePath.length <= 2) {
      const directionsService = new google.maps.DirectionsService()
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#1d6ce0",
            strokeOpacity: 0.8,
            strokeWeight: 5,
          },
        })
      }
      directionsRendererRef.current.setMap(map)
      directionsService.route(
        {
          origin: tripData.origin,
          destination: tripData.destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRendererRef.current?.setDirections(result)
          }
        }
      )
    }
  }, [map, tripData.origin, tripData.destination, routePath])
  // ...existing code...
  // ...existing code...
  // ...existing code...
  // Place reroute logic after all state/hooks

    // Deviation detection state
      // ...existing code...
      // Reroute logic: recalculate route if off route
      useEffect(() => {
        if (!isOffRoute || !position || !tripData.destination || !map) return
        const directionsService = new google.maps.DirectionsService()
        directionsService.route(
          {
            origin: position,
            destination: tripData.destination,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK" && result?.routes[0]) {
              const newPath = result.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }))
              setRoutePath(newPath)
            }
          }
        )})
    // ...existing code...
    // Place reroute useEffect after isOffRoute declaration
    const deviationThreshold = 0.05 // 50 meters (0.05 km)

    // Helper: Find minimum distance from current position to route polyline
    function minDistanceToRoute(position: google.maps.LatLngLiteral, route: google.maps.LatLngLiteral[]): number {
      if (!route.length) return 0
      let minDist = Infinity
      for (let i = 0; i < route.length - 1; i++) {
        const segStart = route[i]
        const segEnd = route[i + 1]
        // Project position onto segment
        const dist = haversineDistanceToSegment(position, segStart, segEnd)
        if (dist < minDist) minDist = dist
      }
      return minDist
    }

    // Helper: Haversine distance to segment
    function haversineDistanceToSegment(p: google.maps.LatLngLiteral, a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral): number {
      // Find closest point on segment ab to p
      const toRad = (deg: number) => (deg * Math.PI) / 180
      const lat1 = toRad(a.lat), lng1 = toRad(a.lng)
      const lat2 = toRad(b.lat), lng2 = toRad(b.lng)
      const lat3 = toRad(p.lat), lng3 = toRad(p.lng)
      // Convert to Cartesian
      const A = [Math.cos(lat1) * Math.cos(lng1), Math.cos(lat1) * Math.sin(lng1), Math.sin(lat1)]
      const B = [Math.cos(lat2) * Math.cos(lng2), Math.cos(lat2) * Math.sin(lng2), Math.sin(lat2)]
      const P = [Math.cos(lat3) * Math.cos(lng3), Math.cos(lat3) * Math.sin(lng3), Math.sin(lat3)]
      // Project P onto AB
      const AB = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]
      const AP = [P[0] - A[0], P[1] - A[1], P[2] - A[2]]
      const abLen = Math.sqrt(AB[0] ** 2 + AB[1] ** 2 + AB[2] ** 2)
      const abNorm = [AB[0] / abLen, AB[1] / abLen, AB[2] / abLen]
      const proj = AP[0] * abNorm[0] + AP[1] * abNorm[1] + AP[2] * abNorm[2]
      let closest
      if (proj <= 0) closest = A
      else if (proj >= abLen) closest = B
      else closest = [A[0] + abNorm[0] * proj, A[1] + abNorm[1] * proj, A[2] + abNorm[2] * proj]
      // Convert back to lat/lng
      const r = Math.sqrt(closest[0] ** 2 + closest[1] ** 2 + closest[2] ** 2)
      const lat = Math.asin(closest[2] / r) * (180 / Math.PI)
      const lng = Math.atan2(closest[1], closest[0]) * (180 / Math.PI)
      return haversineDistance(p, { lat, lng })
    }

    // Listen for route changes (initial route)
    useEffect(() => {
      // If tripData has a route polyline, set it
      // For now, use origin/destination as route
      setRoutePath([tripData.origin, tripData.destination])
    }, [tripData.origin, tripData.destination])

    // Detect deviation
        // Reroute logic: recalculate route if off route
        useEffect(() => {
          if (!isOffRoute || !position || !tripData.destination || !map) return
          const directionsService = new google.maps.DirectionsService()
          directionsService.route(
            {
              origin: position,
              destination: tripData.destination,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === "OK" && result?.routes[0]) {
                const newPath = result.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }))
                setRoutePath(newPath)
              }
            }
          )
        }, [isOffRoute, position, tripData.destination, map])
    useEffect(() => {
      if (!position || !routePath.length) return
      const minDist = minDistanceToRoute(position, routePath)
      setIsOffRoute(minDist > deviationThreshold)
    }, [position, routePath])

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Set up destination marker
  useEffect(() => {
    if (!map) return

    if (!destMarkerRef.current) {
      destMarkerRef.current = new google.maps.Marker({
        map,
        position: tripData.destination,
        title: "Destination",
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#dc2626",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        zIndex: 10,
      })
    }
  }, [map, tripData.destination])

  // Update user marker and path on position change
  useEffect(() => {
    if (!map || !position) return

    // Update or create user marker
    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        map,
        position,
        title: "You",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#1d6ce0",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        zIndex: 15,
      })
    } else {
      userMarkerRef.current.setPosition(position)
    }

    // Calculate distance from last point
    const dist = haversineDistance(prevPositionRef.current, position)
    // Only count if movement > 10m (avoid GPS noise)
    if (dist > 0.01) {
      setDistanceTraveled((prev) => prev + dist)
      setPathPoints((prev) => [...prev, position])
      prevPositionRef.current = position
    }

    // Update polyline
    if (!pathLineRef.current) {
      pathLineRef.current = new google.maps.Polyline({
        map,
        path: [...pathPoints, position],
        strokeColor: "#1d6ce0",
        strokeOpacity: 0.9,
        strokeWeight: 4,
      })
    } else {
      pathLineRef.current.setPath([...pathPoints, position])
    }

    // Pan map to follow user
    map.panTo(position)
  }, [map, position])

  const liveFuelCost = distanceTraveled * costPerKm
  const liveCharge = distanceTraveled * chargePerKm
  const liveProfit = liveCharge - liveFuelCost

  const progress =
    tripData.distance > 0
      ? Math.min((distanceTraveled / tripData.distance) * 100, 100)
      : 0

  const handleEndTrip = useCallback(() => {
    onEndTrip({
      distanceTraveled,
      elapsedTime: formatElapsed(elapsedSeconds),
      fuelCost: liveFuelCost,
      totalCharge: liveCharge,
      profit: liveProfit,
      estimatedDistance: tripData.distance,
      estimatedCharge: tripData.estimatedCharge,
    })
  }, [
    distanceTraveled,
    elapsedSeconds,
    liveFuelCost,
    liveCharge,
    liveProfit,
    tripData,
    onEndTrip,
  ])

  return (
    <div className="space-y-4">
      {/* Active Trip Banner */}
      <Card className="shadow-sm border-2 border-accent bg-accent/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-accent animate-pulse" />
              <div>
                <h3 className="font-heading font-bold text-foreground">Trip In Progress</h3>
                <p className="text-xs text-muted-foreground">
                  Live tracking your journey
                </p>
              </div>
            </div>
            <Badge className="bg-accent text-accent-foreground">
              <Timer className="h-3 w-3 mr-1" />
              {formatElapsed(elapsedSeconds)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Live Map */}
      <Card className="shadow-sm overflow-hidden">
        <div
          ref={mapContainerRef}
          className="w-full h-[350px] sm:h-[400px] bg-secondary"
        />
      </Card>

      {/* Progress Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Trip Progress</span>
            <span className="font-heading font-bold text-foreground">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Navigation className="h-3 w-3" />
              {distanceTraveled.toFixed(1)} km traveled
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {Math.max(0, tripData.distance - distanceTraveled).toFixed(1)} km remaining
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Live Cost Tracker */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2 text-foreground">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            Live Cost Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Live Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-secondary">
              <Route className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground mb-0.5">Distance</p>
              <p className="font-heading text-lg font-bold text-foreground">
                {distanceTraveled.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">km</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary">
              <Fuel className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground mb-0.5">Fuel Spent</p>
              <p className="font-heading text-lg font-bold text-foreground">
                R {liveFuelCost.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary text-primary-foreground">
              <CircleDollarSign className="h-4 w-4 mx-auto mb-1" />
              <p className="text-xs opacity-80 mb-0.5">Running Total</p>
              <p className="font-heading text-lg font-bold">
                R {liveCharge.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Live Profit */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground">
                Running Profit
              </span>
            </div>
            <span className="font-heading text-lg font-bold text-accent">
              R {liveProfit.toFixed(2)}
            </span>
          </div>

          {/* Estimate vs Actual */}
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Estimated vs Actual
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-secondary">
                <p className="text-xs text-muted-foreground">Est. Distance</p>
                <p className="font-heading font-bold text-foreground">
                  {tripData.distance.toFixed(1)} km
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary">
                <p className="text-xs text-muted-foreground">Est. Charge</p>
                <p className="font-heading font-bold text-foreground">
                  R {tripData.estimatedCharge.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* End Trip */}
          <Button
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            size="lg"
            onClick={handleEndTrip}
          >
            <Square className="h-4 w-4 mr-2" />
            End Trip
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Trip Summary component shown after ending a trip
interface TripSummaryCardProps {
  summary: TripSummary;
  onDismiss: () => void;
}
export function TripSummaryCard({ summary, onDismiss }: TripSummaryCardProps) {
  return (
    <Card className="shadow-sm border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="font-heading text-lg flex items-center gap-2 text-foreground">
          <Route className="h-5 w-5 text-primary" />
          Trip Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground">Distance Traveled</p>
            <p className="font-heading text-lg font-bold text-foreground">
              {summary.distanceTraveled.toFixed(1)} km
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-heading text-lg font-bold text-foreground">
              {summary.elapsedTime}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground">Fuel Cost</p>
            <p className="font-heading text-lg font-bold text-foreground">
              R {summary.fuelCost.toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary text-primary-foreground">
            <p className="text-xs opacity-80">Total Charge</p>
            <p className="font-heading text-lg font-bold">
              R {summary.totalCharge.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10 border border-accent/20">
          <span className="text-sm font-medium text-foreground">Total Profit</span>
          <span className="font-heading text-xl font-bold text-accent">
            R {summary.profit.toFixed(2)}
          </span>
        </div>

        {/* Comparison */}
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Estimate Accuracy
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Est. Distance:</span>{" "}
              <span className="font-medium text-foreground">{summary.estimatedDistance.toFixed(1)} km</span>
            </div>
            <div>
              <span className="text-muted-foreground">Actual:</span>{" "}
              <span className="font-medium text-foreground">{summary.distanceTraveled.toFixed(1)} km</span>
            </div>
            <div>
              <span className="text-muted-foreground">Est. Charge:</span>{" "}
              <span className="font-medium text-foreground">R {summary.estimatedCharge.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Actual:</span>{" "}
              <span className="font-medium text-foreground">R {summary.totalCharge.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={onDismiss}>
          Done
        </Button>
      </CardContent>
    </Card>
  )
}
