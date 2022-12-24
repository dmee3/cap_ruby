import React from 'react'
import { render } from 'react-dom'
import { PlusSmallIcon } from '@heroicons/react/24/outline'

import UserTable from '../../../react/widgets/admin/UserTable'

const AdminUsers = () => {
  render(
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between mt-4 mb-2">
        <h1>Users</h1>
        <div>
          <a href="/admin/users/new" className="btn-green btn-lg">
            <PlusSmallIcon className="mr-2 h-6 w-6" />
            New
          </a>
        </div>
      </div>
      <div className="overflow-x-auto align-middle inline-block min-w-full">
        <UserTable />
      </div>
    </div>,
    document.getElementById('users')
  )
}

AdminUsers()
