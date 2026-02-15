"use client"

import { useCallback, useEffect, useRef } from "react"
import type { AgentStatus } from "@/lib/types"

interface VoiceOrbProps {
  status: AgentStatus
  onClick: () => void
}

export function VoiceOrb({ status, onClick }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      timeRef.current += 0.02
      const t = timeRef.current

      ctx.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const baseRadius = Math.min(width, height) * 0.28

      // Outer glow
      if (status === "listening" || status === "speaking") {
        const glowGradient = ctx.createRadialGradient(
          cx,
          cy,
          baseRadius * 0.8,
          cx,
          cy,
          baseRadius * 2
        )
        glowGradient.addColorStop(
          0,
          status === "listening"
            ? "rgba(56, 152, 255, 0.15)"
            : "rgba(45, 190, 150, 0.15)"
        )
        glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = glowGradient
        ctx.fillRect(0, 0, width, height)
      }

      // Pulsing rings
      if (status === "listening") {
        for (let i = 0; i < 3; i++) {
          const pulsePhase = (t * 1.5 + i * 0.8) % 3
          const pulseRadius = baseRadius + pulsePhase * baseRadius * 0.6
          const pulseOpacity = Math.max(0, 0.3 - pulsePhase * 0.1)
          ctx.beginPath()
          ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(56, 152, 255, ${pulseOpacity})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }

      // Main orb shape with organic deformation
      const numPoints = 120
      ctx.beginPath()
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2
        let r = baseRadius

        if (status === "listening") {
          r +=
            Math.sin(angle * 3 + t * 2) * 4 +
            Math.sin(angle * 5 + t * 3) * 2 +
            Math.sin(t * 1.5) * 3
        } else if (status === "speaking") {
          r +=
            Math.sin(angle * 4 + t * 4) * 8 +
            Math.cos(angle * 6 + t * 3) * 5 +
            Math.sin(angle * 2 + t * 5) * 4
        } else if (status === "processing") {
          r +=
            Math.sin(angle * 2 + t * 6) * 3 +
            Math.cos(angle * 8 + t * 4) * 2
        } else {
          r += Math.sin(angle * 3 + t * 0.5) * 1.5
        }

        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()

      // Gradient fill
      const gradient = ctx.createRadialGradient(
        cx - baseRadius * 0.3,
        cy - baseRadius * 0.3,
        0,
        cx,
        cy,
        baseRadius * 1.2
      )

      if (status === "idle") {
        gradient.addColorStop(0, "rgba(56, 152, 255, 0.4)")
        gradient.addColorStop(0.7, "rgba(56, 152, 255, 0.15)")
        gradient.addColorStop(1, "rgba(56, 152, 255, 0.05)")
      } else if (status === "listening") {
        gradient.addColorStop(0, "rgba(56, 152, 255, 0.7)")
        gradient.addColorStop(0.5, "rgba(56, 152, 255, 0.35)")
        gradient.addColorStop(1, "rgba(56, 152, 255, 0.1)")
      } else if (status === "speaking") {
        gradient.addColorStop(0, "rgba(45, 190, 150, 0.7)")
        gradient.addColorStop(0.5, "rgba(45, 190, 150, 0.35)")
        gradient.addColorStop(1, "rgba(45, 190, 150, 0.1)")
      } else {
        gradient.addColorStop(0, "rgba(56, 152, 255, 0.5)")
        gradient.addColorStop(0.5, "rgba(45, 190, 150, 0.25)")
        gradient.addColorStop(1, "rgba(56, 152, 255, 0.08)")
      }

      ctx.fillStyle = gradient
      ctx.fill()

      // Border
      ctx.strokeStyle =
        status === "idle"
          ? "rgba(56, 152, 255, 0.3)"
          : status === "listening"
            ? "rgba(56, 152, 255, 0.6)"
            : status === "speaking"
              ? "rgba(45, 190, 150, 0.6)"
              : "rgba(56, 152, 255, 0.4)"
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Inner waveform bars for speaking
      if (status === "speaking") {
        const barCount = 24
        const barWidth = 2.5
        const maxBarHeight = baseRadius * 0.5
        ctx.save()
        ctx.translate(cx, cy)
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2
          const barHeight =
            maxBarHeight *
            (0.2 +
              0.8 *
                Math.abs(
                  Math.sin(t * 5 + i * 0.5) *
                    Math.cos(t * 3 + i * 0.3)
                ))
          const innerR = baseRadius * 0.35
          ctx.save()
          ctx.rotate(angle)
          ctx.fillStyle = `rgba(45, 190, 150, ${0.3 + 0.4 * Math.abs(Math.sin(t * 4 + i))})`
          ctx.fillRect(
            innerR,
            -barWidth / 2,
            barHeight,
            barWidth
          )
          ctx.restore()
        }
        ctx.restore()
      }

      // Processing spinner
      if (status === "processing") {
        ctx.save()
        ctx.translate(cx, cy)
        const dotCount = 8
        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2 + t * 3
          const dotR = baseRadius * 0.6
          const x = dotR * Math.cos(angle)
          const y = dotR * Math.sin(angle)
          const opacity = 0.2 + 0.6 * ((i / dotCount + t * 0.3) % 1)
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(56, 152, 255, ${opacity})`
          ctx.fill()
        }
        ctx.restore()
      }

      animationRef.current = requestAnimationFrame(() =>
        draw(ctx, width, height)
      )
    },
    [status]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.scale(dpr, dpr)
    draw(ctx, rect.width, rect.height)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [draw])

  const statusLabel =
    status === "idle"
      ? "Click to speak"
      : status === "listening"
        ? "Listening..."
        : status === "speaking"
          ? "Speaking..."
          : "Processing..."

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-6 focus:outline-none group"
      aria-label={statusLabel}
    >
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-pointer"
          style={{ width: "100%", height: "100%" }}
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {status === "idle" && (
            <svg
              className="w-10 h-10 text-primary opacity-60 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          )}
          {status === "listening" && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  style={{
                    animation: `waveform-bar 0.6s ease-in-out ${i * 0.1}s infinite`,
                    height: "24px",
                  }}
                />
              ))}
            </div>
          )}
          {status === "processing" && (
            <svg
              className="w-8 h-8 text-primary animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-muted-foreground tracking-wide uppercase font-medium">
        {statusLabel}
      </span>
    </button>
  )
}
