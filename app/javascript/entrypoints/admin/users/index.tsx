import React from 'react'
import { render } from 'react-dom'

import UserTable from '../../../react/widgets/user_table'

const AdminUsers = () => {
  render(
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between mt-4 mb-2">
        <h1 className="text-4xl">Users</h1>
        <div>
          <a href="/admin/users/new" className="btn-green">
            <svg className="mr-2" width="12" height="20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M6 5a1 1 0 011 1v3h3a1 1 0 110 2H7v3a1 1 0 11-2 0v-3H2a1 1 0 110-2h3V6a1 1 0 011-1z"/>
            </svg>
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
