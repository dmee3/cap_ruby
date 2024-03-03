import React, { useEffect } from "react"

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
    <div className="card-flat flex-grow border-gray-300 group hover:shadow-md hover:border-transparent hover:bg-gradient-to-br hover:from-green-500 hover:to-green-700 flex flex-col sm:flex-row md:flex-col justify-between place-content-stretch transition cursor-pointer">
      <div className="flex flex-row">
        <div className="flex flex-col">
          <div className="flex flex-col md:h-1/2 justify-center">
            <span className="card-title text-gray-500 group-hover:text-green-200 transition">
              DUES OWED
            </span>
            <span className="text-3xl dark:text-gray-300 group-hover:text-white font-extrabold font-mono transition">
              {currencyFormatter.format(expectedDues)}
            </span>
          </div>
          <div className="flex flex-col md:h-1/2 justify-center">
            <span className="card-title text-gray-500 group-hover:text-green-200 transition">
              DUES COLLECTED
            </span>
            <span className="text-3xl dark:text-gray-300 group-hover:text-white font-extrabold font-mono transition">
              {currencyFormatter.format(actualDues)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dues
