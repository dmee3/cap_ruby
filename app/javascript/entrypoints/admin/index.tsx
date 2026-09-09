import React from 'react'
import { render } from 'react-dom'
import AdminDashboard, {
  DashboardBehindMember,
  DashboardRecentPayment,
  DashboardBlankScheduleMember,
  DashboardConflict,
} from '../../react/widgets/admin/AdminDashboard'
import { BurndownPoint } from '../../react/components/BurndownChart'

const el = document.getElementById('admin-dashboard')

if (el) {
  const d = el.dataset
  const parse = <T,>(raw: string | undefined, fallback: T): T => {
    try {
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  }

  render(
    <AdminDashboard
      seasonLabel={d.seasonLabel || ''}
      stats={parse(d.stats, {
        expected_cents: 0,
        collected_cents: 0,
        behind_count: 0,
        member_count: 0,
        average_days_late: null,
      })}
      burndown={parse<{
        scheduled: BurndownPoint[]
        actual: BurndownPoint[]
        today: string
        currency: string
      }>(d.burndown, {
        scheduled: [],
        actual: [],
        today: new Date().toISOString().slice(0, 10),
        currency: 'USD',
      })}
      behindMembers={parse<DashboardBehindMember[]>(d.behindMembers, [])}
      recentPayments={parse<DashboardRecentPayment[]>(d.recentPayments, [])}
      blankScheduleMembers={parse<DashboardBlankScheduleMember[]>(d.blankScheduleMembers, [])}
      conflictsToReview={parse<DashboardConflict[]>(d.conflictsToReview, [])}
    />,
    el,
  )
}
