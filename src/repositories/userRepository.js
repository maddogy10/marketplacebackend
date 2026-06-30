// decides if supabase or aws
import provider from "../providers/postgresProvider.js";
// aws option:
// import provider from '../providers/mysqlProvider.js';

// pass through wrapper, forwards calls to whichever provider is active
const userRepository = {
  createUser: (userData) => provider.createUser(userData),
  findByUid: (uid) => provider.findByUid(uid),
  getAll: () => provider.getAll(),
  upsertUser: (userData) => provider.upsertUser(userData),
};

export default userRepository;
