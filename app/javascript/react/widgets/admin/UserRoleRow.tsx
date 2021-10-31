import React, { useEffect, useState } from 'react'
import InputSelect from '../../components/inputs/InputSelect'
import InputToggle from '../../components/inputs/InputToggle'

type UserRoleRowProps = {
  season: {
    id: number,
    year: string
  },
  userSeason: any
}

const UserRoleRow = ({
  season,
  userSeason
}: UserRoleRowProps) => {
  const [checked, setChecked] = useState(false)
  const [destroy, setDestroy] = useState(checked ? '0' : '1')
  const [roleDisabled, setRoleDisabled] = useState(true)
  const [ensembleDisabled, setEnsembleDisabled] = useState(true)
  const [sectionDisabled, setSectionDisabled] = useState(true)
  const [role, setRole] = useState('')
  const [ensemble, setEnsemble] = useState('')
  const [section, setSection] = useState('')

  useEffect(() => {
    if (!(userSeason.length > 0)) {
      return
    }
    const details = userSeason[0]
    setChecked(true)
    setRoleDisabled(false)
    setRole(details.role)
    setEnsembleDisabled(false)
    setEnsemble(details.ensemble)
    setSectionDisabled(false)
    setSection(details.section)
  }, [userSeason])

  const handleToggle = (newValue) => {
    setChecked(newValue)
    setDestroy(newValue ? '0' : '1')
    setRoleDisabled(!newValue)
    setEnsembleDisabled(!newValue)
    setSectionDisabled(!newValue)
    if (!newValue) {
      setRole('')
      setEnsemble('')
      setSection('')
    }
  }

  const handleRoleChange = (newValue) => {
    setRole(newValue)
    if (newValue !== 'member') {
      setEnsembleDisabled(true)
      setSectionDisabled(true)
    } else {
      setEnsembleDisabled(false)
      setSectionDisabled(false)
    }
  }

  const handleEnsembleChange = (newValue) => {
    setEnsemble(newValue)
  }

  const handleSectionChange = (newValue) => {
    setSection(newValue)
  }

  return(
    <tr key={season.id}>
      <td className="text-sm px-6 py-3">
        <InputToggle
          checked={checked}
          id={`user_seasons_users_attributes_${season.id}__active`}
          name={`user[seasons_users_attributes][][_active]`}
          onChange={handleToggle}
          text={season.year}
        />
        <input type="hidden" name="season_id" value={season.id} />
        <input type="hidden" name="_destroy" value={destroy} />
      </td>
      <td className="text-sm px-6 py-3">
        <InputSelect
          disabled={roleDisabled}
          name={`user[seasons_users_attributes][][role]`}
          onChange={handleRoleChange}
          options={['member', 'staff', 'coordinator', 'admin']}
          prompt="None"
          value={role}
        />
      </td>
      <td className="text-sm px-6 py-3">
        <InputSelect
            disabled={ensembleDisabled}
            name={`user[seasons_users_attributes][][ensemble]`}
            onChange={handleEnsembleChange}
            options={['World', 'CC2']}
            prompt="None"
            value={ensemble}
          />
      </td>
      <td className="text-sm px-6 py-3">
        <InputSelect
          disabled={sectionDisabled}
          name={`user[seasons_users_attributes][][section]`}
          onChange={handleSectionChange}
          options={['Snares', 'Tenors', 'Bass', 'Cymbals', 'Woods', 'Metals', 'Electronics', 'Auxiliary', 'Visual']}
          prompt="None"
          value={section}
        />
      </td>
    </tr>
  )
}

export default UserRoleRow