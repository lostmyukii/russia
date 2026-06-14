import { describe, expect, it } from 'vitest'

import { developmentMilestones } from '../src/index'

describe('development milestones', () => {
  it('keeps the implementation route within the user requested 10 steps', () => {
    expect(developmentMilestones).toHaveLength(8)
    expect(developmentMilestones[0]).toEqual({
      id: 1,
      title: '工程基线',
      percentWhenComplete: 12.5,
    })
    expect(developmentMilestones.at(-1)).toEqual({
      id: 8,
      title: '上线验收',
      percentWhenComplete: 100,
    })
  })
})
