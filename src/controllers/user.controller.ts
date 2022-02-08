import { Service } from "typedi";
import { Request, Response } from "express";
import {
  IUserController,
  FindUserByIdDTO,
  IUser,
  ReturnFindMyProfileDTO,
  UpdateProfileDTO,
} from "../types/user";
import { BadReqError, NotFoundError } from "../utils";
import { UserService } from "../services";

@Service()
export class UserController implements IUserController {
  constructor(private readonly userService: UserService) {}

  findMyProfile = async (
    { user }: Request,
    res: Response<{
      user: ReturnFindMyProfileDTO;
    }>
  ) => {
    const my = await this.userService.findMyProfile(user!.id);
    if (!my) {
      throw new NotFoundError();
    }

    return res.json({ user: my }).status(200);
  };

  updateMyProfile = async (
    { user, body }: Request<unknown, unknown, UpdateProfileDTO>,
    res: Response
  ) => {
    if (!body) {
      throw new BadReqError();
    }
    await this.userService.updateMyProfile(user!.id, body);

    return res.sendStatus(204);
  };

  findUserById = async (
    { params: { id } }: Request<FindUserByIdDTO>,
    res: Response<{ user: IUser }>
  ) => {
    if (!id) {
      throw new NotFoundError();
    }
    const parsedInt = Number(id);

    if (!parsedInt) {
      throw new BadReqError();
    }
    const user = await this.userService.findUserById(parsedInt);
    if (!user) {
      throw new NotFoundError();
    }

    return res.json({ user }).status(200);
  };

  findUsers = async (_: Request, res: Response<{ users: IUser[] }>) => {
    const users = await this.userService.findUsers();

    if (!users) {
      throw new NotFoundError();
    }
    return res.json({ users });
  };
}
