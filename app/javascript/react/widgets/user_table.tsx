import React, { useState, useEffect } from 'react'

type UserTableProps = {}

const UserTable = ({
}: UserTableProps) => {
  const [members, setMembers] = useState([])

  useEffect(() => {
    fetch(`/admin/api/users`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        setMembers(data)
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
            Name
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Section
          </th>
          <th scope="col" className="relative px-6 py-3">
            <span className="sr-only">Edit</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-300 text-sm">
        {members.map(member => {
          return <tr key={member.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex flex-col">
                <div className="font-medium">
                  <a href={`/admin/users/${member.id}`} className="hover:text-gray-500 transition">
                    {member.full_name}
                  </a>
                </div>
                <div className="text-secondary">
                  {member.email}
                </div>
              </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              <div>
                {member.ensemble}
              </div>
              <div className="text-secondary">
                {member.section}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
              <a href={`/admin/users/${member.id}/edit`} className="text-gray-700 hover:text-gray-900 transition">
                Edit
              </a>
            </td>
          </tr>
        })}
      </tbody>
    </table>
  )
}

export default UserTable
