import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import UserForm from '../../../react/widgets/admin/UserForm'

const AdminUsersNew = () => {
  const [seasons, setSeasons] = useState([])
  const user = {}

  useEffect(() => {
    fetch('/api/admin/seasons')
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        setSeasons(data)
      })
      .catch(error => {
        console.error(error)
      })
  }, [])

  return(
    <div className="flex flex-col">
      <h1>New User</h1>
      <UserForm
        user={user}
        seasons={seasons}
      />
    </div>
  )
}

ReactDOM.render(
  <AdminUsersNew />,
  document.getElementById('root')
)
