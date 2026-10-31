import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pluralRu } from './format.ts'

describe('pluralRu', () => {
  it('uses one / few / many including teens', () => {
    assert.equal(pluralRu(0, 'задача', 'задачи', 'задач'), 'задач')
    assert.equal(pluralRu(1, 'задача', 'задачи', 'задач'), 'задача')
    assert.equal(pluralRu(2, 'задача', 'задачи', 'задач'), 'задачи')
    assert.equal(pluralRu(5, 'задача', 'задачи', 'задач'), 'задач')
    assert.equal(pluralRu(11, 'задача', 'задачи', 'задач'), 'задач')
    assert.equal(pluralRu(21, 'задача', 'задачи', 'задач'), 'задача')
    assert.equal(pluralRu(22, 'задача', 'задачи', 'задач'), 'задачи')
  })
})
