import SeasonUser from './seasons_user'

interface User {
  id: number,
  first_name: string,
  last_name: string,
  username: string,
  email: string,
  phone: string,
  seasons_users: Array<SeasonUser>
}

export default User
