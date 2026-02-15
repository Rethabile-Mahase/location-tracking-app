"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Car, Fuel } from "lucide-react"

interface CalculatorFormProps {
  carName: string
  setCarName: (v: string) => void
  carModel: string
  setCarModel: (v: string) => void
  consumption: string
  setConsumption: (v: string) => void
  gasPrice: string
  setGasPrice: (v: string) => void
}

export function CalculatorForm({
  carName,
  setCarName,
  carModel,
  setCarModel,
  consumption,
  setConsumption,
  gasPrice,
  setGasPrice,
}: CalculatorFormProps) {
  return (
    <div className="space-y-6">
      {/* Car Details */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Vehicle Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="carName" className="flex items-center gap-2 text-foreground">
              <Car className="h-4 w-4 text-primary" />
              Car Name
            </Label>
            <Input
              id="carName"
              placeholder="e.g. Toyota"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carModel" className="flex items-center gap-2 text-foreground">
              <Car className="h-4 w-4 text-primary" />
              Model
            </Label>
            <Input
              id="carModel"
              placeholder="e.g. Corolla 1.8"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Fuel Details */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Fuel Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="consumption" className="flex items-center gap-2 text-foreground">
              <Fuel className="h-4 w-4 text-primary" />
              Consumption (litres/100 km)
            </Label>
            <Input
              id="consumption"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 7.5"
              value={consumption}
              onChange={(e) => setConsumption(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Typical range: 5 - 15 litres per 100 km
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gasPrice" className="flex items-center gap-2 text-foreground">
              <span className="inline-flex items-center justify-center h-4 w-4 text-xs font-bold text-primary">R</span>
              Petrol Price (Rands/litre)
            </Label>
            <Input
              id="gasPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 24.50"
              value={gasPrice}
              onChange={(e) => setGasPrice(e.target.value)}
            />
          </div>
        </div>
      </div>


    </div>
  )
}
