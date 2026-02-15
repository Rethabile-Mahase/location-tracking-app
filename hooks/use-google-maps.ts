"use client"

import React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Loader } from "@googlemaps/js-api-loader"

let loaderInstance: Loader | null = null

function getLoader() {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
      libraries: ["places", "geometry"],
    })
  }
  return loaderInstance
}

export function useGoogleMaps(
  mapRef: React.RefObject<HTMLDivElement | null>,
  options?: {
    center?: google.maps.LatLngLiteral
    zoom?: number
  }
) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const loader = getLoader()

    loader
      .importLibrary("maps")
      .then(() => {
        if (!mapRef.current) return

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: options?.center || { lat: -26.2041, lng: 28.0473 },
          zoom: options?.zoom || 12,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        })

        mapInstanceRef.current = mapInstance
        setMap(mapInstance)
        setIsLoaded(true)
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load Google Maps")
      })
  }, [mapRef, options])

  return { map, isLoaded, error }
}

export function useGeolocation() {
  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const watchIdRef = useRef<number | null>(null)

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setLoading(false)
      return
    }

    setLoading(true)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    )
  }, [])

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  useEffect(() => {
    startWatching()
    return () => stopWatching()
  }, [startWatching, stopWatching])

  return { position, error, loading, startWatching, stopWatching }
}

export function useDirections() {
  const [directionsResult, setDirectionsResult] =
    useState<google.maps.DirectionsResult | null>(null)
  const [distance, setDistance] = useState<number>(0)
  const [duration, setDuration] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null)

  const calculateRoute = useCallback(
    async (
      origin: google.maps.LatLngLiteral,
      destination: google.maps.LatLngLiteral,
      map: google.maps.Map
    ) => {
      setLoading(true)
      setError(null)

      try {
        const directionsService = new google.maps.DirectionsService()

        if (!rendererRef.current) {
          rendererRef.current = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#1d6ce0",
              strokeOpacity: 0.8,
              strokeWeight: 5,
            },
          })
        }

        rendererRef.current.setMap(map)

        const result = await directionsService.route({
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        })

        rendererRef.current.setDirections(result)
        setDirectionsResult(result)

        const leg = result.routes[0]?.legs[0]
        if (leg) {
          setDistance((leg.distance?.value || 0) / 1000)
          setDuration(leg.duration?.text || "")
        }
      } catch (err) {
        const error = err as Error
        setError(error.message || "Failed to calculate route")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const clearRoute = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.setMap(null)
    }
    setDirectionsResult(null)
    setDistance(0)
    setDuration("")
    setError(null)
  }, [])

  return {
    directionsResult,
    distance,
    duration,
    loading,
    error,
    calculateRoute,
    clearRoute,
  }
}
