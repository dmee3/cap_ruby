import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import InputPassword from '../../../react/components/inputs/InputPassword'
import InputText from '../../../react/components/inputs/InputText'
import UserRoleRow from '../../../react/widgets/UserRoleRow'

const AdminUsersNew = () => {
  const csrfToken = (document.getElementsByName('csrf-token')[0] as HTMLMetaElement).content

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
    <div className="flex flex-col">
      <h1>New User</h1>
      <form action="/admin/users" method="post">
        <input type='hidden' name='authenticity_token' value={csrfToken} />
        <h2>Basic Info</h2>
        <div className="grid grid-cols-5 gap-x-6 gap-y-4">
          <div className="col-span-5 sm:col-span-1 flex items-center">
            <label htmlFor="first_name" className="input-label">Name</label>
          </div>
          <div className="col-span-5 sm:col-span-2 flex items-center">
            <InputText
              autofocus={true}
              name='user[first_name]'
              placeholder='First'
            />
          </div>
          <div className="col-span-5 sm:col-span-2 flex items-center">
            <InputText
              name='user[last_name]'
              placeholder='Last'
            />
          </div>

          <div className="col-span-5 sm:col-span-1 flex items-center">
            <label htmlFor="username" className="input-label">Username</label>
          </div>
          <div className="col-span-5 sm:col-span-4">
            <InputText
              name='user[username]'
            />
          </div>

          <div className="col-span-5 sm:col-span-1 flex items-center">
            <label htmlFor="email" className="input-label">Email</label>
          </div>
          <div className="col-span-5 sm:col-span-4">
            <InputText
              name='user[email]'
            />
          </div>

          <div className="col-span-5 sm:col-span-1 flex items-center">
            <label htmlFor="password" className="input-label">Password</label>
          </div>
          <div className="col-span-5 sm:col-span-4">
            <InputPassword
              name='user[password]'
            />
          </div>
        </div>
        <h2>Roles</h2>
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

        <div className="mt-4 flex flex-row justify-end">
          <input type="submit" name="commit" value="Save" className="btn-primary btn-lg" />
        </div>
      </form>
    </div>
  )
}

ReactDOM.render(
  <AdminUsersNew />,
  document.getElementById('root')
)
