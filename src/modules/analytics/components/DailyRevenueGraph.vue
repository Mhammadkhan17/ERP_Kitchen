<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatCurrency } from '@/utils/formatters'
import type { DailySales } from '@/types'

const props = withDefaults(defineProps<{
  salesData: DailySales[]
}>(), {
  salesData: () => [],
})

const tooltip = ref<{ x: number; y: number; date: string; revenue: number; orderCount: number } | null>(null)

const pad = { top: 20, right: 20, bottom: 36, left: 64 }
const w = 700
const h = 240

const iw = computed(() => w - pad.left - pad.right)
const ih = computed(() => h - pad.top - pad.bottom)

const maxRev = computed(() => Math.max(...props.salesData.map(d => d.totalRevenue), 1))

const step = computed(() =>
  props.salesData.length > 1 ? iw.value / (props.salesData.length - 1) : iw.value,
)

type Pt = { x: number; y: number; date: string; revenue: number; orderCount: number }
const pts = computed<Pt[]>(() =>
  props.salesData.map((d, i) => ({
    x: pad.left + i * step.value,
    y: pad.top + ih.value - (d.totalRevenue / maxRev.value) * ih.value,
    date: d.date,
    revenue: d.totalRevenue,
    orderCount: d.orderCount,
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

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function onMove(e: MouseEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const mx = e.clientX - rect.left
  let best = pts.value[0]
  let bestD = Infinity
  for (const p of pts.value) {
    const d = Math.abs(p.x - mx)
    if (d < bestD) { bestD = d; best = p }
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
    <h3 class="text-base font-semibold text-gray-900 mb-4">Daily Revenue</h3>
    <svg
      :viewBox="`0 0 ${w} ${h}`"
      class="w-full"
      @mousemove="onMove"
      @mouseleave="onLeave"
    >
      <defs>
        <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E85D3A" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#E85D3A" stop-opacity="0.02" />
        </linearGradient>
      </defs>

      <line
        v-for="(t, i) in yTicks" :key="i"
        :x1="pad.left"
        :y1="pad.top + ih - (t / maxRev) * ih"
        :x2="w - pad.right"
        :y2="pad.top + ih - (t / maxRev) * ih"
        stroke="#E9ECEF" stroke-width="1"
      />

      <text
        v-for="(t, i) in yTicks" :key="'y' + i"
        :x="pad.left - 8"
        :y="pad.top + ih - (t / maxRev) * ih + 4"
        text-anchor="end" fill="#6C757D" class="text-[10px]"
      >{{ formatCurrency(t) }}</text>

      <path v-if="areaD" :d="areaD" fill="url(#rev-grad)" />
      <path v-if="lineD" :d="lineD" fill="none" stroke="#E85D3A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />

      <circle
        v-for="(p, i) in pts" :key="i"
        :cx="p.x" :cy="p.y" r="3.5" fill="#E85D3A" stroke="#fff" stroke-width="2"
        class="cursor-pointer"
      />

      <text
        v-for="(p, i) in pts" :key="'x' + i"
        v-show="i % labelEvery === 0"
        :x="p.x" :y="h - 4"
        text-anchor="middle" fill="#6C757D" class="text-[10px]"
      >{{ shortDate(p.date) }}</text>

      <g v-if="tooltip">
        <line
          :x1="tooltip.x" :y1="pad.top"
          :x2="tooltip.x" :y2="pad.top + ih"
          stroke="#E85D3A" stroke-width="1" stroke-dasharray="3"
        />
        <rect
          :x="Math.min(tooltip.x - 52, w - 120)"
          :y="Math.max(tooltip.y - 48, pad.top)"
          width="104" height="36" rx="4" fill="#1A1D1F"
        />
        <text
          :x="Math.min(tooltip.x - 52, w - 120) + 52"
          :y="Math.max(tooltip.y - 48, pad.top) + 14"
          text-anchor="middle" fill="#fff" class="text-[10px] font-medium"
        >{{ formatCurrency(tooltip.revenue) }}</text>
        <text
          :x="Math.min(tooltip.x - 52, w - 120) + 52"
          :y="Math.max(tooltip.y - 48, pad.top) + 28"
          text-anchor="middle" fill="#ADB5BD" class="text-[9px]"
        >{{ shortDate(tooltip.date) }} · {{ tooltip.orderCount }} orders</text>
      </g>
    </svg>
    <div v-if="!salesData.length" class="text-center text-gray-400 py-12 text-sm">
      No sales data available
    </div>
  </div>
</template>
