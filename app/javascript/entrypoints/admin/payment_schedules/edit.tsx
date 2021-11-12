import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

const AdminPaymentSchedulesEdit = () => {
  const [user, setUser] = useState({})

  useEffect(() => {
    // fetch(`/api/admin/users/${window.userId}`)
    //   .then(resp => {
    //     if (resp.ok) {
    //       return resp.json()
    //     }
    //     throw resp
    //   })
    //   .then(data => setUser(data))
    //   .catch(error => console.error(error))
  }, [])

  return(
    <div className="flex flex-col">
      <h1>Edit Payment Schedule for {window.fullName}</h1>
    </div>
  )
}

ReactDOM.render(
  <AdminPaymentSchedulesEdit />,
  document.getElementById('root')
)
