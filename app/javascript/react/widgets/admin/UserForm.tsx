import React, { useEffect, useState } from 'react'

import User from '../../declarations/user'

import InputPassword from '../../../react/components/inputs/InputPassword'
import InputText from '../../../react/components/inputs/InputText'

import UserRoleRow from './UserRoleRow'

type UserFormType = {
  user: User,
  seasons: Array<any>
}

const UserForm = ({
  user,
  seasons
}: UserFormType) => {
  const csrfToken = (document.getElementsByName('csrf-token')[0] as HTMLMetaElement).content
  const [internalUser, setInternalUser] = useState({})
  const [formUrl, setFormUrl] = useState('/admin/users')
  const [formPut, setFormPut] = useState(false)

  useEffect(() => {
    setInternalUser(user)
    if (user.id) {
      setFormUrl(`/admin/users/${user.id}`)
      setFormPut(true)
    }
  }, [user])

  return (
    <form action={formUrl} method="post">
      {formPut && <input type="hidden" name="_method" value="put" />}
      <input type='hidden' name='authenticity_token' value={csrfToken} />
      <h2>Basic Info</h2>
      <div className="grid grid-cols-5 gap-x-6 gap-y-4">
        <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
          <label htmlFor="first_name" className="input-label">Name</label>
        </div>
        <div className="col-span-5 sm:col-span-2 -mb-2 sm:mb-0 flex items-center">
          <InputText
            autofocus={true}
            name='user[first_name]'
            placeholder='First'
            value={internalUser.first_name}
          />
        </div>
        <div className="col-span-5 sm:col-span-2 flex items-center">
          <InputText
            name='user[last_name]'
            placeholder='Last'
            value={internalUser.last_name}
          />
        </div>

        <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
          <label htmlFor="username" className="input-label">Username</label>
        </div>
        <div className="col-span-5 sm:col-span-4">
          <InputText
            name='user[username]'
            value={internalUser.username}
          />
        </div>

        <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
          <label htmlFor="email" className="input-label">Email</label>
        </div>
        <div className="col-span-5 sm:col-span-4">
          <InputText
            name='user[email]'
            value={internalUser.email}
          />
        </div>

        {!internalUser.id && (
          <>
            <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
              <label htmlFor="password" className="input-label">Password</label>
            </div>
            <div className="col-span-5 sm:col-span-4">
              <InputPassword
                name='user[password]'
              />
            </div>
          </>
        )}
      </div>

      <h2 className="mt-6">Roles</h2>
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
          {seasons.map(season => <UserRoleRow key={season.id} season={season} userSeason={internalUser.seasons_users ? internalUser.seasons_users.filter(su => su.season_id === season.id) : {}} />)}
        </tbody>
      </table>

      <div className="mt-4 flex flex-row justify-end">
        <input type="submit" name="commit" value="Save" className="btn-primary btn-lg" />
      </div>
    </form>
  )
}

export default UserForm