import fuzzysort from 'fuzzysort'
import React, { useState, useEffect } from 'react'

type UserTableProps = {}

const UserTable = ({
}: UserTableProps) => {
  const [members, setMembers] = useState([])
  const [staff, setStaff] = useState([])
  const [displayedMemberList, setDisplayedMemberList] = useState([])
  const [displayedStaffList, setDisplayedStaffList] = useState([])

  useEffect(() => {
    fetch(`/api/admin/users`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        const staff = data
          .filter(u => u.role !== 'member')
          .map(staff => ({
            ...staff,
            searchStr: `${staff.role} ${staff.full_name}`
          }))
        setStaff(staff)
        setDisplayedStaffList(staff)

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
        setDisplayedMemberList(members)
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

  const filterLists = searchTerm => {
    if (searchTerm.length < 2) {
      setDisplayedMemberList(members)
      setDisplayedStaffList(staff)
      return
    }

    const filteredMemberList = performFuzzySearch(searchTerm, members)
    setDisplayedMemberList(filteredMemberList)

    const filteredStaffList = performFuzzySearch(searchTerm, staff)
    setDisplayedStaffList(filteredStaffList)
  }

  const performFuzzySearch = (searchTerm, list) => (
    fuzzysort
      .go(searchTerm, list, {
        allowTypo: true,
        key: 'searchStr',
        threshold: -50,
      })
      .map((item) => item.obj)
  )

  return(
    <>
      <input
        placeholder="Filter by name/section/ensemble"
        name="search"
        className="input-text"
        type="text"
        onChange={evt => filterLists(evt.target.value)}
      />
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="col-span-2 lg:col-span-1">
          <h2 className="mt-6">Members</h2>
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
              {displayedMemberList.map(member => {
                return <tr key={member.id} className="table-row-hover" onClick={() => handleMemberClick(member.id)}>
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
        </div>
        <div className="col-span-2 lg:col-span-1">
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
              {displayedStaffList.map(st => {
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
        </div>
      </div>
    </>
  )
}

export default UserTable
