import * as React from 'react'
import { useState } from 'react'
import InputSelect from '../components/inputs/InputSelect'
import InputToggle from '../components/inputs/InputToggle'

type UserRoleRowProps = {
  season: {
    id: number,
    year: string
  }
}

const UserRoleRow = ({
  season
}: UserRoleRowProps) => {
  const [checked, setChecked] = useState(false)
  const [disabled, setDisabled] = useState(true)
  const [role, setRole] = useState('')
  const [ensemble, setEnsemble] = useState('')
  const [section, setSection] = useState('')

  const handleToggle = (newValue) => {
    setChecked(newValue)
    setDisabled(!newValue)
    if (!newValue) {
      setRole('')
      setEnsemble('')
      setSection('')
    }
  }

  const handleRoleChange = (newValue) => {
    setRole(newValue)
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
          id={`user_seasons_users_attributes_${season.id}__destroy`}
          name={`user[seasons_users_attributes][${season.id}][_destroy]`}
          onChange={handleToggle}
          text={season.year}
        />
      </td>
      <td className="text-sm px-6 py-3">
        <InputSelect
          disabled={disabled}
          name={`user[seasons_users_attributes][${season.id}][role]`}
          onChange={handleRoleChange}
          options={['member', 'staff', 'coordinator', 'admin']}
          prompt="None"
          value={role}
        />
      </td>
      <td className="text-sm px-6 py-3">
        <InputSelect
            disabled={disabled}
            name={`user[seasons_users_attributes][${season.id}][ensemble]`}
            onChange={handleEnsembleChange}
            options={['World', 'CC2']}
            prompt="None"
            value={ensemble}
          />
      </td>
      <td className="text-sm px-6 py-3">
        <InputSelect
          disabled={disabled}
          name={`user[seasons_users_attributes][${season.id}][section]`}
          onChange={handleSectionChange}
          options={['Snares', 'Tenors', 'Basses', 'Cymbals', 'Woods', 'Metals', 'Electronics', 'Auxiliary', 'Visual']}
          prompt="None"
          value={section}
        />
      </td>
    </tr>
  )
}

export default UserRoleRow