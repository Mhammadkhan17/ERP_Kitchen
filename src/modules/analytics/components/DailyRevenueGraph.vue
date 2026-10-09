<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatCurrency } from '@/utils/formatters'
import { ORANGE } from '@/constants/palette'

interface RevenuePoint {
  label: string
  revenue: number
  orderCount: number
}

const props = withDefaults(
  defineProps<{
    points?: RevenuePoint[]
  }>(),
  {
    points: () => [],
  },
)

const tooltip = ref<{
  x: number
  y: number
  label: string
  revenue: number
  orderCount: number
} | null>(null)

const pad = { top: 20, right: 20, bottom: 36, left: 64 }
const w = 700
const h = 240

const iw = computed(() => w - pad.left - pad.right)
const ih = computed(() => h - pad.top - pad.bottom)

const maxRev = computed(() => Math.max(...props.points.map((p) => p.revenue), 1))

const step = computed(() =>
  props.points.length > 1 ? iw.value / (props.points.length - 1) : iw.value,
)

type Pt = { x: number; y: number; label: string; revenue: number; orderCount: number }
const pts = computed<Pt[]>(() =>
  props.points.map((p, i) => ({
    x: pad.left + i * step.value,
    y: pad.top + ih.value - (p.revenue / maxRev.value) * ih.value,
    label: p.label,
    revenue: p.revenue,
    orderCount: p.orderCount,
  })),
)

const lineD = computed(() => {
  if (pts.value.length < 2) return ''
  return pts.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
})

const areaD = computed(() => {
  if (pts.value.length < 2) return ''
  const a = pts.value[0]
  const b = pts.value[pts.value.length - 1]
  const bot = pad.top + ih.value
  return `${lineD.value} L${b.x},${bot} L${a.x},${bot} Z`
})

const yTicks = computed(() => {
  const n = 5
  return Array.from({ length: n }, (_, i) => (maxRev.value / (n - 1)) * i)
})

function onMove(e: MouseEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const mx = e.clientX - rect.left
  let best = pts.value[0]
  let bestD = Infinity
  for (const p of pts.value) {
    const d = Math.abs(p.x - mx)
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  tooltip.value = best
}

function onLeave() {
  tooltip.value = null
}

const labelEvery = computed(() => Math.max(1, Math.floor(pts.value.length / 7)))
</script>

<template>
  <div class="card">
    <h3 class="text-base font-semibold text-gray-900 mb-4">Revenue Trend</h3>
    <div class="relative">
      <svg :viewBox="`0 0 ${w} ${h}`" class="w-full" @mousemove="onMove" @mouseleave="onLeave">
        <defs>
          <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="ORANGE[600]" stop-opacity="0.25" />
            <stop offset="100%" :stop-color="ORANGE[600]" stop-opacity="0.02" />
          </linearGradient>
        </defs>

        <line
          v-for="(t, i) in yTicks"
          :key="i"
          :x1="pad.left"
          :y1="pad.top + ih - (t / maxRev) * ih"
          :x2="w - pad.right"
          :y2="pad.top + ih - (t / maxRev) * ih"
          class="stroke-gray-200"
          stroke-width="1"
        />

        <text
          v-for="(t, i) in yTicks"
          :key="'y' + i"
          :x="pad.left - 8"
          :y="pad.top + ih - (t / maxRev) * ih + 4"
          text-anchor="end"
          class="fill-gray-500"
          font-size="12"
        >
          {{ formatCurrency(t) }}
        </text>

        <path v-if="areaD" :d="areaD" fill="url(#rev-grad)" />
        <path
          v-if="lineD"
          :d="lineD"
          fill="none"
          :stroke="ORANGE[600]"
          stroke-width="2.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <circle
          v-for="(p, i) in pts"
          :key="i"
          :cx="p.x"
          :cy="p.y"
          r="3.5"
          :fill="ORANGE[600]"
          class="cursor-pointer stroke-white"
          stroke-width="2"
        />

        <text
          v-for="(p, i) in pts"
          v-show="i % labelEvery === 0"
          :key="'x' + i"
          :x="p.x"
          :y="h - 4"
          text-anchor="middle"
          class="fill-gray-500"
          font-size="12"
        >
          {{ p.label }}
        </text>

        <g v-if="tooltip">
          <line
            :x1="tooltip.x"
            :y1="pad.top"
            :x2="tooltip.x"
            :y2="pad.top + ih"
            :stroke="ORANGE[600]"
            stroke-width="1"
            stroke-dasharray="3"
          />
          <rect
            :x="Math.min(tooltip.x - 52, w - 120)"
            :y="Math.max(tooltip.y - 48, pad.top)"
            width="104"
            height="36"
            rx="4"
            class="fill-gray-900"
          />
          <text
            :x="Math.min(tooltip.x - 52, w - 120) + 52"
            :y="Math.max(tooltip.y - 48, pad.top) + 14"
            text-anchor="middle"
            class="fill-white font-medium"
            font-size="12"
          >
            {{ formatCurrency(tooltip.revenue) }}
          </text>
          <text
            :x="Math.min(tooltip.x - 52, w - 120) + 52"
            :y="Math.max(tooltip.y - 48, pad.top) + 28"
            text-anchor="middle"
            class="fill-gray-400"
            font-size="12"
          >
            {{ tooltip.label }} · {{ tooltip.orderCount }} orders
          </text>
        </g>
      </svg>
      <div
        v-if="!points.length"
        class="absolute inset-0 flex items-center justify-center text-sm text-gray-400 bg-white"
      >
        No sales data available
      </div>
    </div>
  </div>
</template>
