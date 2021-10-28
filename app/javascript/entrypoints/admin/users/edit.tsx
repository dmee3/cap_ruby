import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import UserRoleRow from '../../../react/widgets/UserRoleRow'

const AdminUsersEdit = () => {
  const [seasons, setSeasons] = useState([])

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
    <table className="min-w-full divide-y divide-gray-500">
      <thead>
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Seasons
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Role
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Ensemble
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Section
          </th>
        </tr>
      </thead>
      <tbody>
        {seasons.map(season => <UserRoleRow key={season.id} season={season} />)}
      </tbody>
    </table>
  )
}

ReactDOM.render(
  <AdminUsersEdit />,
  document.getElementById('roles-section')
)
