/* eslint-disable no-useless-constructor */
import { Service } from "typedi";
import { OkPacket } from "mysql2/promise";
import {
  IUserService,
  IUser,
  ReturnFindMyProfileDTO,
  UpdateProfileDTO,
} from "../types/user";
import { UserDAO } from "../daos";

@Service()
class UserService implements IUserService {
  constructor(private userDAO: UserDAO) {}

  findMyProfile(id: number): Promise<ReturnFindMyProfileDTO | undefined> {
    return this.userDAO.findMyProfile(id);
  }

  updateMyProfile(id: number, body: UpdateProfileDTO) {
    return this.userDAO.updateMyProfile(id, body);
  }

  findUserById(id: number): Promise<IUser | undefined> {
    return this.userDAO.findOneById(id);
  }

  findUsers(): Promise<IUser[] | undefined> {
    return this.userDAO.find();
  }

  findUserByEmail(email: string) {
    return this.userDAO.findByEmail(email);
  }

  createUser(email: string): Promise<OkPacket> {
    return this.userDAO.create(email);
  }
}

export default UserService;
