<script setup lang="ts">
import { onClickOutside, useIdle, useIntervalFn, useTimeoutFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

// Prototype of Nova, the Nethesis mascot, drawn by hand in layers so the
// parts can move. Moods:
// - normal: breathes, blinks, waves when it appears and from time to time
// - happy: jumps for joy raising the arms, with smiling eyes, after a check-in
// - bye: waves goodbye, after a check-out
// - sad: droopy eyes and bent head, next to an error
// A tap makes it hop, with wide eyes. While the help is open, the light of
// the antenna stays on and the robot tilts its head towards the bubble.
export type MascotMood = 'normal' | 'happy' | 'bye' | 'sad'

const props = withDefaults(
  defineProps<{
    mood?: MascotMood
    // Words in a speech bubble above the head
    message?: string
    // What to do on the page, in the bubble after a tap
    help?: string
  }>(),
  { mood: 'normal', message: '', help: '' }
)

const WAVE_EVERY_MS = { normal: 20_000, bye: 3_000 } as const
// Any running animation makes the browser draw every frame: without
// touches the mascot stands still, so the idle tablet draws nothing
const STILL_AFTER_MS = 2 * 60_000

const { t } = useI18n()
const { idle } = useIdle(STILL_AFTER_MS)
const waving = shallowRef(false)
const jumping = shallowRef(false)
// The small jump of a tap, instead of the jump for joy
const hop = shallowRef(false)
const helpOpen = shallowRef(false)
const root = useTemplateRef('root')
const bubbleId = useId()

// No waving while it reads the help with the visitor
const canWave = computed(() => (props.mood === 'normal' || props.mood === 'bye') && !helpOpen.value)
const bubble = computed(() => (helpOpen.value ? props.help : props.message))

function wave() {
  if (canWave.value && !idle.value) {
    waving.value = true
  }
}

function greet() {
  if (props.mood === 'happy') {
    hop.value = false
    jumping.value = !idle.value
  } else {
    wave()
  }
}

useTimeoutFn(greet, props.mood === 'normal' ? 1200 : 400)
useIntervalFn(wave, () => (props.mood === 'bye' ? WAVE_EVERY_MS.bye : WAVE_EVERY_MS.normal))
// Back to life with a greeting at the first touch
watch(idle, (isIdle) => {
  if (!isIdle) {
    greet()
  }
})
// It stays in the layout across pages: greet each new mood
watch(() => props.mood, greet)

function onTap() {
  helpOpen.value = !!props.help && !helpOpen.value
  if ((helpOpen.value || !props.help) && !jumping.value) {
    waving.value = false
    hop.value = true
    jumping.value = true
  }
}
// The help is about one page or step: a touch elsewhere or a new step closes it
onClickOutside(root, () => {
  helpOpen.value = false
})
watch(
  () => props.help,
  () => {
    helpOpen.value = false
  }
)

function onAnimationEnd(event: AnimationEvent) {
  // The jump for joy or the hop, whichever the robot made
  if (/jump|hop/.test(event.animationName)) jumping.value = false
  if (event.animationName.includes('wave')) waving.value = false
}
</script>

<!-- Fixed in the bottom-left corner, only where it fits beside the content,
as on a tablet held landscape. The help bubble is wider and may cover the
content: it closes at the next touch -->
<template>
  <div ref="root" class="motion-safe:animate-rise rise-delay-2 pointer-events-none fixed bottom-4 left-4 z-10 hidden flex-col items-start lg:flex">
    <p
      v-if="bubble"
      :id="bubbleId"
      :key="bubble"
      :class="[
        'motion-safe:animate-rise bg-elevation-0 text-primary-neutral pointer-events-auto relative mb-3 rounded-md px-3 py-2 text-sm font-medium shadow-sm',
        helpOpen ? 'w-64' : 'w-32'
      ]"
    >
      {{ bubble }}
      <span class="bg-elevation-0 absolute -bottom-1.5 left-12 h-3 w-3 rotate-45" aria-hidden="true" />
    </p>
    <!-- Custom markup: the robot itself is the button -->
    <button
      type="button"
      :aria-label="t('kiosk.mascot.show_help')"
      :aria-expanded="help ? helpOpen : undefined"
      :aria-controls="helpOpen ? bubbleId : undefined"
      class="focus-visible:ring-offset-primary-600 pointer-events-auto cursor-pointer rounded-md focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
      @click="onTap"
    >
      <svg
        viewBox="0 0 160 220"
        :class="['mascot block w-28 overflow-visible', `mood-${mood}`, { moving: !idle, jumping, hop, reading: helpOpen }]"
        aria-hidden="true"
        @animationend="onAnimationEnd"
      >
        <ellipse cx="80" cy="212" rx="44" ry="5" class="shadow fill-black/15" />

        <g class="robot">
          <!-- Legs and feet stay still while breathing -->
          <rect x="58" y="174" width="14" height="22" class="fill-gray-300" />
          <rect x="86" y="174" width="14" height="22" class="fill-gray-300" />
          <rect x="54" y="196" width="26" height="14" rx="4" class="fill-gray-400" />
          <rect x="51" y="193" width="26" height="14" rx="4" class="fill-gray-200" />
          <rect x="84" y="196" width="26" height="14" rx="4" class="fill-gray-400" />
          <rect x="81" y="193" width="26" height="14" rx="4" class="fill-gray-200" />
          <circle cx="64" cy="201" r="2" class="fill-primary-500" />
          <circle cx="94" cy="201" r="2" class="fill-primary-500" />

          <g class="upper">
            <!-- Neck -->
            <rect x="71" y="90" width="16" height="14" rx="3" class="fill-primary-400" />

            <!-- Body, with the logo on the chest -->
            <rect x="47" y="104" width="72" height="76" rx="10" class="fill-gray-400" />
            <rect x="42" y="100" width="72" height="76" rx="10" class="fill-gray-200" />
            <rect x="55" y="116" width="46" height="32" rx="6" class="fill-primary-500" />
            <rect x="58" y="119" width="40" height="26" rx="4" class="fill-primary-400" />
            <path d="M70 140 v-8 a7 7 0 0 1 14 0 v8" class="fill-none stroke-white" stroke-width="3.5" stroke-linecap="round" />
            <path d="M89 123 l-1 5" class="stroke-white" stroke-width="3" stroke-linecap="round" />

            <!-- Left arm -->
            <g class="arm-left">
              <rect x="31" y="108" width="14" height="46" rx="6" class="fill-gray-300" />
              <circle cx="38" cy="157" r="6.5" class="fill-primary-400" />
            </g>
            <circle cx="40" cy="110" r="7" class="fill-primary-400" />

            <!-- Right arm, the one that waves -->
            <g :class="['arm-right', { waving }]">
              <rect x="111" y="108" width="14" height="46" rx="6" class="fill-gray-300" />
              <circle cx="118" cy="157" r="6.5" class="fill-primary-400" />
            </g>
            <circle cx="117" cy="110" r="7" class="fill-primary-400" />

            <g class="head">
              <!-- Antenna, it wobbles when the robot lands -->
              <g class="antenna">
                <rect x="77" y="10" width="3" height="22" rx="1.5" class="fill-gray-500" />
                <circle cx="78.5" cy="9" r="6" class="antenna-glow fill-primary-300" />
                <circle cx="78.5" cy="9" r="4.5" class="fill-primary-500" />
                <circle cx="78.5" cy="9" r="4.5" class="antenna-light fill-white opacity-0" />
              </g>

              <rect x="39" y="32" width="88" height="62" rx="12" class="fill-gray-400" />
              <rect x="34" y="28" width="88" height="62" rx="12" class="fill-gray-200" />
              <rect x="54" y="35" width="48" height="3" rx="1.5" class="fill-gray-400" />
              <rect x="43" y="43" width="70" height="34" rx="9" class="fill-gray-800" />
              <!-- A group of its own: the eyes blink, and widen at a tap -->
              <g class="eyes-pop">
                <g v-if="mood === 'happy'">
                  <path d="M52 64 Q62 50 72 64" class="stroke-primary-300 fill-none" stroke-width="5" stroke-linecap="round" />
                  <path d="M84 64 Q94 50 104 64" class="stroke-primary-300 fill-none" stroke-width="5" stroke-linecap="round" />
                </g>
                <g v-else class="eyes">
                  <circle cx="62" cy="60" r="11" class="fill-primary-300" />
                  <circle cx="62" cy="60" r="7.5" class="fill-primary-500" />
                  <circle cx="59" cy="57" r="2.5" class="fill-white" />
                  <circle cx="94" cy="60" r="11" class="fill-primary-300" />
                  <circle cx="94" cy="60" r="7.5" class="fill-primary-500" />
                  <circle cx="91" cy="57" r="2.5" class="fill-white" />
                  <!-- Eyelids, lower on the outer side -->
                  <template v-if="mood === 'sad'">
                    <polygon points="49,47 75,47 75,52 49,61" class="fill-gray-800" />
                    <polygon points="81,47 107,47 107,61 81,52" class="fill-gray-800" />
                  </template>
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.mascot g,
.shadow {
  transform-box: view-box;
}

.robot,
.shadow {
  transform-origin: 80px 210px;
}

/* The arms rest slightly open, rotating on the shoulders */
.arm-left {
  transform-origin: 40px 110px;
  transform: rotate(8deg);
}

.arm-right {
  transform-origin: 117px 110px;
  transform: rotate(-8deg);
}

.eyes,
.eyes-pop {
  transform-origin: 78px 60px;
}

.antenna {
  transform-origin: 78.5px 32px;
}

.upper {
  transform-origin: 80px 180px;
}

.head {
  transform-origin: 80px 92px;
}

.mood-sad .head {
  transform: rotate(-6deg) translateY(3px);
}

/* While the help is open: the head tilts towards the bubble, with the light on */
.reading .head {
  transform: rotate(-5deg) translateY(-2px);
}

.reading .antenna-light {
  opacity: 0.85;
}

@media (prefers-reduced-motion: no-preference) {
  .moving .upper {
    animation: breathe 4s ease-in-out infinite;
  }

  .moving .eyes {
    animation: blink 5s infinite;
  }

  .moving:not(.mood-sad) .antenna-glow {
    animation: glow 2s ease-in-out infinite;
  }

  .moving .head {
    transition: transform 0.4s ease-out;
  }

  .moving .antenna-light {
    transition: opacity 0.3s;
  }

  .moving .arm-right.waving {
    animation: wave 2.4s ease-in-out;
  }

  .moving.jumping .robot {
    animation: jump 0.9s ease-in-out;
  }

  .moving.jumping .shadow {
    animation: shadow 0.9s ease-in-out;
  }

  .moving.jumping .antenna {
    animation: wobble 0.9s ease-out;
  }

  .moving.jumping .arm-left {
    animation: arm-left 0.9s ease-in-out;
  }

  .moving.jumping .arm-right {
    animation: arm-right 0.9s ease-in-out;
  }

  /* The small jump: lower and quicker, the same arms, shadow and antenna */
  .moving.jumping.hop .robot {
    animation-name: hop;
  }

  .moving.jumping.hop :is(.robot, .shadow, .antenna, .arm-left, .arm-right) {
    animation-duration: 0.6s;
  }

  .moving.jumping.hop .eyes-pop {
    animation: pop 0.6s ease-out;
  }
}

@keyframes breathe {
  50% {
    transform: translateY(-3px) scaleY(1.01);
  }
}

@keyframes blink {
  0%,
  96%,
  100% {
    transform: scaleY(1);
  }
  98% {
    transform: scaleY(0.1);
  }
}

@keyframes glow {
  50% {
    opacity: 0.3;
  }
}

/* Up, three waves of the hand, down */
@keyframes wave {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  20%,
  50%,
  80% {
    transform: rotate(-150deg);
  }
  35%,
  65% {
    transform: rotate(-125deg);
  }
}

/* Wide eyes for a moment */
@keyframes pop {
  0%,
  100% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.25);
  }
  60% {
    transform: scale(0.95);
  }
}

/* A cartoon jump: crouch, stretch on the way up, squash on landing, settle */
@keyframes jump {
  0%,
  100% {
    transform: none;
  }
  15% {
    transform: scale(1.08, 0.88);
  }
  35% {
    transform: translateY(-22px) scale(0.94, 1.08);
  }
  50% {
    transform: translateY(-26px);
  }
  68% {
    transform: scale(1.1, 0.88);
  }
  80% {
    transform: translateY(-4px) scale(0.97, 1.03);
  }
  90% {
    transform: scale(1.02, 0.98);
  }
}

/* The same, lower: a hop */
@keyframes hop {
  0%,
  100% {
    transform: none;
  }
  15% {
    transform: scale(1.05, 0.92);
  }
  35% {
    transform: translateY(-10px) scale(0.97, 1.04);
  }
  50% {
    transform: translateY(-12px);
  }
  68% {
    transform: scale(1.05, 0.93);
  }
  85% {
    transform: translateY(-2px);
  }
}

/* The arms rise a little in the air and fall back at the landing */
@keyframes arm-left {
  0%,
  100% {
    transform: rotate(8deg);
  }
  15%,
  72% {
    transform: rotate(4deg);
  }
  40%,
  55% {
    transform: rotate(40deg);
  }
}

@keyframes arm-right {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  15%,
  72% {
    transform: rotate(-4deg);
  }
  40%,
  55% {
    transform: rotate(-40deg);
  }
}

/* Smaller and lighter while the robot is in the air */
@keyframes shadow {
  0%,
  15%,
  68%,
  100% {
    transform: none;
    opacity: 1;
  }
  50% {
    transform: scaleX(0.6);
    opacity: 0.5;
  }
}

/* The antenna lags behind at the landing */
@keyframes wobble {
  0%,
  68%,
  100% {
    transform: none;
  }
  76% {
    transform: rotate(-10deg);
  }
  84% {
    transform: rotate(7deg);
  }
  92% {
    transform: rotate(-3deg);
  }
}
</style>
