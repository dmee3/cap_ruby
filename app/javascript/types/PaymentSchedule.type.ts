type PaymentSchedule = {
  id: number
  user_id: number
  season_id: number
  payment_schedule_entries: Array<PaymentScheduleEntry>
}
