import React, { useEffect } from "react"
import Chart from "chart.js/auto"
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

  const groupPaymentsByWeek = payments => {
    return payments.reduce((acc, payment) => {
      const dt = DateTime.fromISO(payment.date_paid)
      const week = dt.startOf('week').minus({ days: 1 }).toLocaleString() // Previous Sunday
      const key = `Week of ${week}`
      if (!acc.find(entry => entry.key === key)) {
        acc.push({ key: key, dt: dt, amount: 0 })
      }
      acc.find(entry => entry.key === key).amount += payment.amount / 100.0

      return acc
    }, [])
  }

  const fetchPayments = () => {
    useEffect(() => {
      fetch(`/api/admin/payments/collected`)
        .then(resp => {
          if (resp.ok) {
            return resp.json()
          }
          throw resp
        })
        .then(data => {
          const groupedData = groupPaymentsByWeek(data)
          drawChart(groupedData.sort((a, b) => a.dt.diff(b.dt).toObject().milliseconds))
        })
        .catch(error => {
          console.error(error)
        })
    }, [])
  }

  const drawChart = (data) => {


    const canvas = document.getElementById('dues-paid') as HTMLCanvasElement

    new Chart(
      canvas,
      {
        type: 'bar',
        data: {
          labels: data.map(row => row.key),
          datasets: [
            {
              label: 'Dues collected',
              data: data.map(row => row.amount)
            }
          ]
        },
        options: {
          elements: {
            bar: {
              backgroundColor: ChartColor.grey().rgbString()
            },
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: context => {
                  return `$${context.formattedValue} Collected`
                },

              }
            }
          },
          scales: {
            y: {
              display: false
            },
            x: {
              border: {
                color: ChartColor.white().rgbString(),
              },
              grid: {
                display: false
              },
              ticks: {
                display: false
              }
            }
          }
        },
      }
    );
  }

  fetchPayments()

  return (
    <>
      <div className="flex flex-row">
        <div className="flex flex-col">
          <div className="flex flex-col md:h-1/2 justify-center">
            <span className="card-title text-gray-500 group-hover:text-green-200 transition">
              DUES OWED
            </span>
            <span className="text-3xl group-hover:text-white font-extrabold font-mono transition">
              {currencyFormatter.format(expectedDues)}
            </span>
          </div>
          <div className="flex flex-col md:h-1/2 justify-center">
            <span className="card-title text-gray-500 group-hover:text-green-200 transition">
              DUES COLLECTED
            </span>
            <span className="text-3xl group-hover:text-white font-extrabold font-mono transition">
              {currencyFormatter.format(actualDues)}
            </span>
          </div>
        </div>
        <div className="relative grow ml-4">
          <canvas id="dues-paid"></canvas>
        </div>
      </div>
    </>
  )
}

export default Dues
