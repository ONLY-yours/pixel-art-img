'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ImageTransformer() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [blackAndWhiteImage, setBlackAndWhiteImage] = useState<string | null>(null)
  const [pixelatedImage, setPixelatedImage] = useState<string | null>(null)
  const [crtImage, setCrtImage] = useState<string | null>(null)
  const [pixelSize, setPixelSize] = useState<number>(10)
  const [scanlineIntensity, setScanlineIntensity] = useState<number>(0.2)
  const [colorShift, setColorShift] = useState<number>(2)
  const [noiseAmount, setNoiseAmount] = useState<number>(10)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string)
        setBlackAndWhiteImage(null)
        setPixelatedImage(null)
        setCrtImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const transformToBlackAndWhite = () => {
    if (!originalImage) return

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      if (canvas) {
        canvas.width = img.width
        canvas.height = img.height
      }
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          data[i] = avg
          data[i + 1] = avg
          data[i + 2] = avg
        }

        ctx.putImageData(imageData, 0, 0)

        setBlackAndWhiteImage(canvas.toDataURL())
      }
    }
    img.src = originalImage
  }

  const transformToPixelArt = (size: number) => {
    if (!blackAndWhiteImage) return

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (ctx) {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0, img.width, img.height)

        for (let y = 0; y < img.height; y += size) {
          for (let x = 0; x < img.width; x += size) {
            const pixelData = ctx.getImageData(x, y, size, size).data
            let r = 0, g = 0, b = 0, a = 0

            for (let i = 0; i < pixelData.length; i += 4) {
              r += pixelData[i]
              g += pixelData[i + 1]
              b += pixelData[i + 2]
              a += pixelData[i + 3]
            }

            const pixelCount = pixelData.length / 4
            r = Math.round(r / pixelCount)
            g = Math.round(g / pixelCount)
            b = Math.round(b / pixelCount)
            a = Math.round(a / pixelCount)

            ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
            ctx.fillRect(x, y, size, size)
          }
        }

        setPixelatedImage(canvas.toDataURL())
      }
    }
    img.src = blackAndWhiteImage
  }

  const transformToCRT = (scanlineIntensity: number, colorShift: number, noiseAmount: number) => {
    if (!originalImage) return

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')

      canvas.width = img.width

      canvas.height = img.height

      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Apply CRT effects

        for (let y = 0; y < canvas.height; y++) {

          for (let x = 0; x < canvas.width; x++) {

            const index = (y * canvas.width + x) * 4

            // Scanline effect
            const scanlineEffect = Math.sin(y * 0.1) * scanlineIntensity
            data[index] *= 1 - scanlineEffect
            data[index + 1] *= 1 - scanlineEffect
            data[index + 2] *= 1 - scanlineEffect

            // Color shift

            if (x + colorShift < canvas.width) {
              data[index] = data[index + colorShift * 4]
            }

            // Add noise
            const noise = (Math.random() - 0.5) * noiseAmount
            data[index] += noise
            data[index + 1] += noise
            data[index + 2] += noise
          }
        }

        ctx.putImageData(imageData, 0, 0)

        // Apply vignette effect
        const gradient = ctx.createRadialGradient(

          canvas.width / 2, canvas.height / 2, 0,

          canvas.width / 2, canvas.height / 2, canvas.width / 2
        )
        gradient.addColorStop(0, 'rgba(0,0,0,0)')
        gradient.addColorStop(1, 'rgba(0,0,0,0.7)')
        ctx.fillStyle = gradient

        ctx.fillRect(0, 0, canvas.width, canvas.height)

        setCrtImage(canvas.toDataURL())
      }
    }
    img.src = originalImage
  }

  useEffect(() => {
    if (blackAndWhiteImage) {
      transformToPixelArt(pixelSize)
    }
  }, [blackAndWhiteImage, pixelSize])

  useEffect(() => {
    if (originalImage) {
      transformToCRT(scanlineIntensity, colorShift, noiseAmount)
    }
  }, [originalImage, scanlineIntensity, colorShift, noiseAmount])

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Label htmlFor="image-upload" className="mb-2 block">Upload an image</Label>
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="mb-2"
        />
      </div>
      <Tabs defaultValue="bw-pixel" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bw-pixel">B&W and Pixel</TabsTrigger>
          <TabsTrigger value="crt">CRT Effect</TabsTrigger>
        </TabsList>
        <TabsContent value="bw-pixel">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Original Image</h2>
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="Original uploaded image"
                  className="max-w-full h-auto rounded shadow mb-4"
                />
              ) : (
                <div className="bg-gray-100 p-4 rounded text-center mb-4">
                  Upload an image to see it here
                </div>
              )}
              <Button
                onClick={transformToBlackAndWhite}
                className="w-full"
                disabled={!originalImage}
              >
                Transform to Black & White
              </Button>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Black & White Image</h2>
              {blackAndWhiteImage ? (
                <img
                  src={blackAndWhiteImage}
                  alt="Black and white transformed image"
                  className="max-w-full h-auto rounded shadow mb-4"
                />
              ) : (
                <div className="bg-gray-100 p-4 rounded text-center mb-4">
                  Transform to black & white to see the result here
                </div>
              )}
              <Button
                onClick={() => transformToPixelArt(pixelSize)}
                className="w-full"
                disabled={!blackAndWhiteImage}
              >
                Apply Pixelation
              </Button>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Pixelated Image</h2>
              {pixelatedImage ? (
                <img
                  src={pixelatedImage}
                  alt="Pixelated image"
                  className="max-w-full h-auto rounded shadow mb-4"
                />
              ) : (
                <div className="bg-gray-100 p-4 rounded text-center mb-4">
                  Apply pixelation to see the result here
                </div>
              )}
              <div className="mt-4">
                <Label htmlFor="pixel-size" className="mb-2 block">Pixel Size: {pixelSize}</Label>
                <Slider
                  id="pixel-size"
                  min={1}
                  max={50}
                  step={1}
                  value={[pixelSize]}
                  onValueChange={(value) => setPixelSize(value[0])}
                  className="w-full"
                  disabled={!blackAndWhiteImage}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="crt">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Original Image</h2>
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="Original uploaded image"
                  className="max-w-full h-auto rounded shadow mb-4"
                />
              ) : (
                <div className="bg-gray-100 p-4 rounded text-center mb-4">
                  Upload an image to see it here
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">CRT Effect Image</h2>
              {crtImage ? (
                <img
                  src={crtImage}
                  alt="CRT effect image"
                  className="max-w-full h-auto rounded shadow mb-4"
                />
              ) : (
                <div className="bg-gray-100 p-4 rounded text-center mb-4">
                  Upload an image to see the CRT effect here
                </div>
              )}
              <div className="mt-4">
                <Label htmlFor="scanline-intensity" className="mb-2 block">Scanline Intensity: {scanlineIntensity.toFixed(2)}</Label>
                <Slider
                  id="scanline-intensity"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[scanlineIntensity]}
                  onValueChange={(value) => setScanlineIntensity(value[0])}
                  className="w-full"
                  disabled={!originalImage}
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="color-shift" className="mb-2 block">Color Shift: {colorShift}</Label>
                <Slider
                  id="color-shift"
                  min={0}
                  max={10}
                  step={1}
                  value={[colorShift]}
                  onValueChange={(value) => setColorShift(value[0])}
                  className="w-full"
                  disabled={!originalImage}
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="noise-amount" className="mb-2 block">Noise Amount: {noiseAmount}</Label>
                <Slider
                  id="noise-amount"
                  min={0}
                  max={50}
                  step={1}
                  value={[noiseAmount]}
                  onValueChange={(value) => setNoiseAmount(value[0])}
                  className="w-full"
                  disabled={!originalImage}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}