import { csrfToken } from './api'

export default class {
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

  static getAuthToken() {
    return csrfToken()
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
