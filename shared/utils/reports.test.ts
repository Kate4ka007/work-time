import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createEmptyStore } from '../types/store.ts'
import {
  getPeriodRange,
  getTodayTotalMs,
  reportRangeFromDates,
} from './reports.ts'

describe('reportRangeFromDates', () => {
  it('returns local day bounds for a valid range', () => {
    const range = reportRangeFromDates('2026-10-31', '2026-10-31')
    assert.ok(range)
    assert.equal(range.start.getHours(), 0)
    assert.equal(range.end.getHours(), 23)
  })

  it('rejects empty, inverted, and malformed dates', () => {
    assert.equal(reportRangeFromDates('', '2026-10-31'), null)
    assert.equal(reportRangeFromDates('2026-11-02', '2026-10-31'), null)
    assert.equal(reportRangeFromDates('31-10-2026', '2026-10-31'), null)
  })
})

describe('getTodayTotalMs', () => {
  it('adds running timer started today', () => {
    const now = new Date('2026-10-31T12:00:00').getTime()
    const { start } = getPeriodRange('day', new Date(now))
    const store = createEmptyStore()
    store.entries.push({
      id: '11111111-1111-4111-8111-111111111111',
      taskId: '22222222-2222-4222-8222-222222222222',
      startedAt: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
      endedAt: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      durationMs: 60 * 60 * 1000,
      source: 'timer',
    })
    store.activeTimer = {
      taskId: '22222222-2222-4222-8222-222222222222',
      startedAt: new Date(now - 10 * 60 * 1000).toISOString(),
    }

    assert.equal(getTodayTotalMs(store, now), 60 * 60 * 1000 + 10 * 60 * 1000)
  })
})
