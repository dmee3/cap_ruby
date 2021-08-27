export default class {
  static displayDateTime(dt: string | number | Date) {
    const format = {
      dateStyle: 'short',
      timeStyle: 'short',
    }
    const date = new Date(dt)
    return new Intl.DateTimeFormat('en-US', format).format(date)
  }

  // Display date as "dow, mm/dd"
  static displayDate(date: Date) {
    const format = {
      weekday: 'short' as const, // Deal with TS error
      month: 'numeric' as const,
      day: 'numeric' as const
    }
    return new Intl.DateTimeFormat('en-US', format).format(date)
  }

  static formatMmDdYyyy(d: Date) {
    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`
  }

  static formatIsoDate(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
  }

  static formatMoney(num: number) {
    return (num / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
  }

  static getAuthToken() {
    const crsfElement = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement
    return crsfElement.content
  }

  static getJWT() {
    return this.readCookie('jwt')
  }

  static readCookie(name: string) {
    const nameEQ = name + '='
    const cookiesArray = document.cookie.split(';')

    for (let i = 0; i < cookiesArray.length; i++) {
      let c = cookiesArray[i]

      // Trim whitespace
      while (c.charAt(0) == ' ') c = c.substring(1, c.length)

      // Check for and return cookie value if we find a match
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length)
    }

    return null
  }
}