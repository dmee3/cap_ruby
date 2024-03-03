export default class {
  static displayDateTimeShort(dt: string | number | Date) {
    const format = {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/New_York',
    }
    const date = new Date(dt)
    return new Intl.DateTimeFormat('en-US', format).format(date)
  }

  static displayDateTimeReadable(dt: string | number | Date) {
    const format = {
      weekday: 'short' as const, // Deal with TS error
      month: 'numeric' as const,
      day: 'numeric' as const,
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }
    const date = new Date(dt)
    return new Intl.DateTimeFormat('en-US', format).format(date)
  }

  // Display date as "dow, mm/dd"
  static displayDate(date: Date) {
    const format = {
      weekday: 'short' as const, // Deal with TS error
      month: 'numeric' as const,
      day: 'numeric' as const,
    }
    return new Intl.DateTimeFormat('en-US', format).format(date)
  }

  static dateWithTZ(d: string) {
    return new Date(`${d}T00:00:00.000-05:00`)
  }

  static dateSorter(dateA: string, dateB: string) {
    return (new Date(dateA)).getTime() - (new Date(dateB)).getTime()
  }

  // Returns negative if dateStr is in the past, positive if future, and 0 for today
  static compareToToday(dateStr: string) {
    const today = new Date((new Date).toDateString())
    const dateObj = new Date(dateStr + 'T05:00:00Z')
    return dateObj.getTime() - today.getTime()
  }

  static formatMmDdYyyy(d: Date) {
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  static formatIsoDate(d: Date) {
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  }

  static formatMoney(num: number) {
    return (num / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
  }

  static statusToColor(status: string) {
    switch (status) {
      case 'Approved':
        return 'green'
      case 'Denied':
        return 'red'
      case 'Pending':
        return 'yellow'
      default:
        return 'gray'
    }
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

  static fileToDataString(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }
}
