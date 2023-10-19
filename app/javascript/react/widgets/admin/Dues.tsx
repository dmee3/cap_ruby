import React from "react"

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
      <div className="flex flex-col md:h-1/2 justify-center">
        <span className="card-title font-bold group-hover:text-green-200 transition">
          {`Dues as of ${new Date().toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}`.toUpperCase()}
        </span>
        <span className="card-title text-gray-500 group-hover:text-green-200 transition">
          OWED
        </span>
        <span className="text-3xl group-hover:text-white font-extrabold font-mono transition">
          {currencyFormatter.format(expectedDues)}
        </span>
      </div>
      <div className="flex flex-col md:h-1/2 justify-center">
        <span className="card-title text-gray-500 group-hover:text-green-200 transition">
          COLLECTED
        </span>
        <span className="text-3xl group-hover:text-white font-extrabold font-mono transition">
          {currencyFormatter.format(actualDues)}
        </span>
      </div>
    </>
  )
}

export default Dues
