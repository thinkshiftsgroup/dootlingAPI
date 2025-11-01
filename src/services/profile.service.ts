import { PrismaClient, Biodata, User } from "@prisma/client";

const prisma = new PrismaClient();

type UserWithoutPassword = Omit<User, "password">;

interface UserUpdateData {
  firstname?: string;
  lastname?: string;
}
interface BiodataUpdateData {
  dateOfBirth?: Date;
  country?: string;
  pronouns?: string;
  phone?: string;
  city?: string;
  role?: string;
  industry?: string;
  tags?: string;
  headline?: string;
}

type UpdateData = UserUpdateData & BiodataUpdateData;

interface UserProfileData {
  id: string;
  email: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  fullName: string;
  profilePhotoUrl?: string | null;

  biodata: {
    dateOfBirth: Date;
    country: string | null;
    pronouns: string | null;
    phone: string | null;
    city: string | null;
    role: string | null;
    industry: string | null;
    tags: string | null;
    headline: string | null;
    languages?: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
  } | null;
}

type UserWithBiodata = User & { biodata: Biodata | null };

const mapUserToProfileData = (user: UserWithBiodata): UserProfileData => {
  const username = user.username ?? null;

  return {
    id: user.id,
    email: user.email,
    username: username,
    firstname: user.firstname,
    lastname: user.lastname,
    fullName: user.fullName,
    profilePhotoUrl: user.profilePhotoUrl,
    biodata: user.biodata,
  };
};

export async function fetchBiodata(userId: string): Promise<UserProfileData> {
  try {
    let user = (await prisma.user.findUnique({
      where: { id: userId },
      include: {
        biodata: true,
      },
    })) as UserWithBiodata;

    if (!user) {
      throw new Error(`User with ID: ${userId} not found.`);
    }

    if (!user.biodata) {
      const newBiodata = await prisma.biodata.create({
        data: {
          userId: userId,
          dateOfBirth: new Date(),
          headline: `A new member, ${user.fullName || user.email}, has joined!`,
        },
      });
      user = { ...user, biodata: newBiodata };
    }

    return mapUserToProfileData(user);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Could not fetch or create biodata details."
    );
  }
}

export async function updateProfile(
  userId: string,
  data: UpdateData
): Promise<UserProfileData> {
  const {
    firstname,
    lastname,
    dateOfBirth,
    country,
    pronouns,
    phone,
    city,
    role,
    industry,
    tags,
    headline,
  } = data;

  const userUpdatePayload: any = {};

  if (firstname !== undefined) userUpdatePayload.firstname = firstname;
  if (lastname !== undefined) userUpdatePayload.lastname = lastname;

  if (firstname !== undefined || lastname !== undefined) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found during update preparation.");
    }

    const newFirst = firstname !== undefined ? firstname : user.firstname || "";
    const newLast = lastname !== undefined ? lastname : user.lastname || "";

    userUpdatePayload.fullName = `${newFirst} ${newLast}`.trim();
  }

  const biodataPayload: any = {};

  if (dateOfBirth) {
    try {
      biodataPayload.dateOfBirth = new Date(dateOfBirth);
      if (isNaN(biodataPayload.dateOfBirth.getTime())) {
        throw new Error("Invalid date format provided for dateOfBirth.");
      }
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Invalid date format for dateOfBirth.";
      throw new Error(errorMessage);
    }
  }

  if (country !== undefined) biodataPayload.country = country;
  if (pronouns !== undefined) biodataPayload.pronouns = pronouns;
  if (phone !== undefined) biodataPayload.phone = phone;
  if (city !== undefined) biodataPayload.city = city;
  if (role !== undefined) biodataPayload.role = role;
  if (industry !== undefined) biodataPayload.industry = industry;
  if (tags !== undefined) biodataPayload.tags = tags;
  if (headline !== undefined) biodataPayload.headline = headline;

  try {
    const [updatedUser, updatedBiodata] = await prisma.$transaction([
      Object.keys(userUpdatePayload).length > 0
        ? prisma.user.update({
            where: { id: userId },
            data: userUpdatePayload,
          })
        : prisma.user.findUniqueOrThrow({ where: { id: userId } }),

      prisma.biodata.upsert({
        where: { userId: userId },
        update: biodataPayload,
        create: {
          userId: userId,
          ...biodataPayload,
          dateOfBirth: biodataPayload.dateOfBirth || new Date(),
        },
      }),
    ]);

    if (!updatedUser) {
      throw new Error("User not found during update transaction.");
    }

    const userWithBiodata: UserWithBiodata = {
      ...updatedUser,
      biodata: updatedBiodata,
    };

    return mapUserToProfileData(userWithBiodata);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Could not update profile details.";
    throw new Error(errorMessage);
  }
}
export async function updateProfilePhotoUrl(
  userId: string,
  profilePhotoUrl: string | null
): Promise<UserProfileData> {
  try {
    const updatedUser = (await prisma.user.update({
      where: { id: userId },
      data: {
        profilePhotoUrl: profilePhotoUrl,
      },
      include: {
        biodata: true,
      },
    })) as UserWithBiodata;

    return mapUserToProfileData(updatedUser);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Could not update profile photo URL.";
    throw new Error(errorMessage);
  }
}
