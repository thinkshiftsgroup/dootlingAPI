import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function fetchBiodata(userId: string) {
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

export async function updateBiodata(userId: string, data: any) {
  const { age, country, state, role, industry, headline } = data;

  const updatePayload = {
    age,
    country,
    state,
    role,
    industry,
    headline,
  };

  try {
    const updatedBiodata = await prisma.biodata.upsert({
      where: {
        userId: userId,
      },
      update: updatePayload,
      create: {
        userId: userId,
        ...updatePayload,
      },
    });

    return updatedBiodata;
  } catch (error) {
    console.error("Error updating/creating biodata:", error);
    throw new Error("Could not update biodata details.");
  }
}
