import fuzzysort from 'fuzzysort'
import React, { useState, useEffect } from 'react'

type UserTableProps = {}

const UserTable = ({
}: UserTableProps) => {
  const [members, setMembers] = useState([])
  const [displayedList, setDisplayedList] = useState([])

  useEffect(() => {
    fetch(`/api/admin/users`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        const users = data.map(member => ({
          ...member,
          searchStr: `${member.ensemble} ${member.section} ${member.full_name}`
        })).sort((a, b) => {
          if (a.ensemble === 'World' && b.ensemble === 'CC2') {
            return -1
          } else if (a.ensemble === 'CC2' && b.ensemble === 'World') {
            return 1
          } else {
            const aCompStr = `${a.section}${a.first_name}${a.last_name}`
            const bCompStr = `${b.section}${b.first_name}${b.last_name}`
            return aCompStr > bCompStr ? 1 : -1
          }
        })
        setMembers(users)
        setDisplayedList(users)
      })
      .catch(error => {
        console.error(error)
      })
  }, [])

  const handleMemberClick = memberId => {
    window.location.href = `/admin/users/${memberId}`
  }

  const handleEditClick = (memberId, e) => {
    e.stopPropagation()
    window.location.href = `/admin/users/${memberId}/edit`
  }

  const filterList = searchTerm => {
    if (searchTerm.length < 2) {
      setDisplayedList(members)
      return
    }

    const filteredList = fuzzysort
      .go(searchTerm, members, {
        allowTypo: true,
        key: 'searchStr',
        threshold: -50,
      })
      .map((item) => item.obj)
    setDisplayedList(filteredList)
  }

  return(
    <>
      <div className="mb-4">
        <input
          placeholder="Filter by name/section/ensemble"
          name="search"
          className="input-text"
          type="text"
          onChange={evt => filterList(evt.target.value)}
        />
      </div>
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
          {displayedList.map(member => {
            return <tr key={member.id} className="hover:bg-gray-100 cursor-pointer" onClick={() => handleMemberClick(member.id)}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {member.full_name}
                  </span>
                  <span className="text-secondary">
                    {member.email}
                  </span>
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
                <span className="link" onClick={e => handleEditClick(member.id, e)}>
                  Edit
                </span>
              </td>
            </tr>
          })}
        </tbody>
      </table>
    </>
  )
}

export default UserTable
