//  Copyright (C) 2026 Nethesis S.r.l.
//  SPDX-License-Identifier: GPL-3.0-or-later

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NeDatePickerPreset } from '@nethesis/vue-components'

// The translated texts of NeDatePicker and NeDateRangeFilter, to bind with v-bind
export function useDatePickerLabels() {
  const { t } = useI18n()

  // the texts of the calendar, used by both components
  const calendarLabels = computed(() => ({
    cancelLabel: t('ne_date_picker.cancel'),
    selectLabel: t('ne_date_picker.select'),
    presetsLabel: t('ne_date_picker.presets'),
    previousMonthLabel: t('ne_date_picker.previous_month'),
    nextMonthLabel: t('ne_date_picker.next_month'),
    previousYearLabel: t('ne_date_picker.previous_year'),
    nextYearLabel: t('ne_date_picker.next_year'),
    previousYearsLabel: t('ne_date_picker.previous_years'),
    nextYearsLabel: t('ne_date_picker.next_years'),
    chooseMonthLabel: t('ne_date_picker.choose_month'),
    chooseYearLabel: t('ne_date_picker.choose_year'),
    chooseEndDateLabel: t('ne_date_picker.choose_end_date'),
  }))

  // the texts of the field and of the time, used by NeDatePicker only
  const datePickerLabels = computed(() => ({
    ...calendarLabels.value,
    optionalLabel: t('common.optional'),
    chooseDateLabel: t('ne_date_picker.choose_date'),
    chooseTimeLabel: t('ne_date_picker.choose_time'),
    clearLabel: t('ne_date_picker.clear'),
    invalidDateLabel: t('ne_date_picker.invalid_date'),
    invalidRangeLabel: t('ne_date_picker.invalid_range'),
    invalidDateTimeLabel: t('ne_date_picker.invalid_date_time'),
    invalidTimeLabel: t('ne_date_picker.invalid_time'),
    unavailableDateLabel: t('ne_date_picker.unavailable_date'),
    unavailableTimeLabel: t('ne_date_picker.unavailable_time'),
    hoursLabel: t('ne_date_picker.hours'),
    minutesLabel: t('ne_date_picker.minutes'),
    secondsLabel: t('ne_date_picker.seconds'),
    dayPeriodLabel: t('ne_date_picker.day_period'),
    increaseHoursLabel: t('ne_date_picker.increase_hours'),
    decreaseHoursLabel: t('ne_date_picker.decrease_hours'),
    increaseMinutesLabel: t('ne_date_picker.increase_minutes'),
    decreaseMinutesLabel: t('ne_date_picker.decrease_minutes'),
    increaseSecondsLabel: t('ne_date_picker.increase_seconds'),
    decreaseSecondsLabel: t('ne_date_picker.decrease_seconds'),
  }))

  return { calendarLabels, datePickerLabels }
}

// a day as 'yyyy-MM-dd', days after today (before, if negative)
function isoDay(offset = 0, date = new Date()) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
}

// Ranges of days up to today, for NeDateRangeFilter
export function useDateRangePresets() {
  const { t } = useI18n()

  return computed<NeDatePickerPreset[]>(() => [
    { label: t('ne_date_picker.today'), value: () => [isoDay(), isoDay()] },
    { label: t('ne_date_picker.last_7_days'), value: () => [isoDay(-6), isoDay()] },
    { label: t('ne_date_picker.last_30_days'), value: () => [isoDay(-29), isoDay()] },
    {
      label: t('ne_date_picker.this_month'),
      value: () => [isoDay(1 - new Date().getDate()), isoDay()],
    },
  ])
}
