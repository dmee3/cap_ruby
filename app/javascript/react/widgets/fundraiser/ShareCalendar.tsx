import React, { useState } from 'react'

type ShareCalendarProps = {
  shareUrl: string
  firstName: string
}

/**
 * Share is the highest-leverage element on the confirmation page: it's what
 * produces the next donation, so it's a real button rather than a footnote.
 *
 * Uses the native share sheet where there is one (which is where this page
 * mostly gets seen, since donors arrive from shared links on phones) and falls
 * back to copying the link.
 */
const ShareCalendar = ({ shareUrl, firstName }: ShareCalendarProps) => {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const text = `Help ${firstName} fill their Cap City calendar`

    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url: shareUrl })
        return
      } catch {
        // Dismissed the sheet, or it failed. Fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard blocked: the URL is visible in the field beside this, so
      // there's still a way to share it by hand.
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button type="button" onClick={share} className="btn-primary btn-lg">
        Share {firstName}'s calendar
      </button>
      {/* aria-live so the confirmation is announced, not just shown. */}
      <span className="text-body-sm text-success-fg" aria-live="polite">
        {copied ? 'Link copied' : ''}
      </span>
    </div>
  )
}

export default ShareCalendar
