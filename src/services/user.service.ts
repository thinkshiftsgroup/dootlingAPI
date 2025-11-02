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

export async function fetchUserBiodata(
  userId: string
): Promise<UserProfileData> {
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
