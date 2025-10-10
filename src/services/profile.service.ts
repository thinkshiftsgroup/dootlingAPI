import { PrismaClient, Biodata } from "@prisma/client";

const prisma = new PrismaClient();

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

export async function fetchBiodata(userId: string): Promise<Biodata | null> {
  try {
    const biodata = await prisma.biodata.findUnique({
      where: {
        userId: userId,
      },
    });
    return biodata;
  } catch (error) {
    console.error("Error fetching biodata:", error);
    throw new Error("Could not fetch biodata details.");
  }
}

export async function updateProfile(
  userId: string,
  data: UpdateData
): Promise<{ user: any; biodata: Biodata }> {
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
    if (user) {
      const newFirst =
        firstname !== undefined ? firstname : user.firstname || "";
      const newLast = lastname !== undefined ? lastname : user.lastname || "";

      userUpdatePayload.fullName = `${newFirst} ${newLast}`.trim();
    }
  }

  const biodataPayload: any = {};

  if (dateOfBirth !== undefined) biodataPayload.dateOfBirth = dateOfBirth;
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
        : prisma.user.findUnique({ where: { id: userId } }),

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

    const { password, ...userWithoutPassword } = updatedUser;

    return { user: userWithoutPassword, biodata: updatedBiodata };
  } catch (error) {
    console.error("Error updating profile:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Could not update profile details.";
    throw new Error(errorMessage);
  }
}
