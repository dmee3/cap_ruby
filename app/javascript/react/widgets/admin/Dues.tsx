import React, { useEffect } from "react"
import { DateTime } from "luxon"
import ChartColor from "../../../utilities/chart_color"

type DuesProps = {
  expectedDues: number,
  actualDues: number
}

const Dues = ({ expectedDues, actualDues }: DuesProps) => {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return (
    <>
      <div className="flex flex-row">
        <div className="flex flex-col">
          <div className="flex flex-col md:h-1/2 justify-center">
            <span className="card-title">
              DUES OWED
            </span>
            <span className="text-metric font-mono text-primary">
              {currencyFormatter.format(expectedDues)}
            </span>
          </div>
          <div className="flex flex-col md:h-1/2 justify-center">
            <span className="card-title text-success-fg">
              DUES COLLECTED
            </span>
            <span className="text-metric font-mono text-success-fg">
              {currencyFormatter.format(actualDues)}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dues
