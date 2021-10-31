import SeasonUser from './seasons_user'

interface User {
  id: Number,
  first_name: string,
  last_name: string,
  username: string,
  email: String,
  phone: string,
  seasons_users: Array<SeasonUser>
}

export default User
