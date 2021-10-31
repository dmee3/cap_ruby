import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import UserForm from '../../../react/widgets/admin/UserForm'

const AdminUsersEdit = () => {
  const [seasons, setSeasons] = useState([])
  const [user, setUser] = useState({})

  useEffect(() => {
    fetch('/api/admin/seasons')
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => setSeasons(data))
      .catch(error => console.error(error))

    fetch(`/api/admin/users/${window.userId}`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => setUser(data))
      .catch(error => console.error(error))
  }, [])

  return(
    <div className="flex flex-col">
      <h1>Edit {user.first_name}</h1>
      <UserForm
        user={user}
        seasons={seasons}
      />
    </div>
  )
}

ReactDOM.render(
  <AdminUsersEdit />,
  document.getElementById('root')
)
