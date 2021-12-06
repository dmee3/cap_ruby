import fuzzysort from 'fuzzysort'
import React, { useState, useEffect } from 'react'

type UserTableProps = {}

const UserTable = ({
}: UserTableProps) => {
  const [members, setMembers] = useState([])
  const [staff, setStaff] = useState([])
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
        setStaff(data.filter(u => u.role !== 'member'))

        const members = data.filter(u => u.role === 'member')
          .map(member => ({
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
        setMembers(members)
        setDisplayedList(members)
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
      <h2>Members</h2>
      <div className="mb-4">
        <input
          placeholder="Filter by name/section/ensemble"
          name="search"
          className="input-text"
          type="text"
          onChange={evt => filterList(evt.target.value)}
        />
      </div>
      <table className="custom-table">
        <thead>
          <tr>
            <th scope="col" className="table-header">
              Name
            </th>
            <th scope="col" className="table-header">
              Section
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody className="table-body">
          {displayedList.map(member => {
            return <tr key={member.id} className="" onClick={() => handleMemberClick(member.id)}>
              <td className="table-cell">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {member.full_name}
                  </span>
                  <span className="text-secondary">
                    {member.email}
                  </span>
                </div>
              </td>

              <td className="table-cell">
                <div>
                  {member.ensemble}
                </div>
                <div className="text-secondary">
                {member.section}
                </div>
              </td>
              <td className="table-cell text-right font-medium">
                <span className="link" onClick={e => handleEditClick(member.id, e)}>
                  Edit
                </span>
              </td>
            </tr>
          })}
        </tbody>
      </table>
      <h2 className="mt-6">Staff</h2>
      <table className="custom-table">
        <thead>
          <tr>
            <th scope="col" className="table-header">
              Name
            </th>
            <th scope="col" className="table-header">
              Role
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody className="table-body">
          {staff.map(st => {
            return <tr key={st.id}>
              <td className="table-cell">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {st.full_name}
                  </span>
                  <span className="text-secondary">
                    {st.email}
                  </span>
                </div>
              </td>

              <td className="table-cell">
                <div>
                  {st.role}
                </div>
              </td>
              <td className="table-cell text-right font-medium">
                <span className="link cursor-pointer" onClick={e => handleEditClick(st.id, e)}>
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
