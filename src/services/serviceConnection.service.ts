import { PrismaClient, ServiceConnection } from "@prisma/client";

const prisma = new PrismaClient();

export type ServiceType = "GITHUB" | "JIRA" | "GMAIL" | "GOOGLE_MEET";

interface CreateConnectionData {
  userId: string;
  serviceType: ServiceType;
  serviceAccountId: string;
  accessToken: string;
  refreshToken?: string;
  connectionMetadata?: any;
}

interface UpdateConnectionData {
  accessToken?: string;
  refreshToken?: string;
  connectionStatus?: string;
  connectionMetadata?: any;
  lastSyncAt?: Date;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  repos_url: string;
}

export async function createServiceConnection(
  data: CreateConnectionData
): Promise<ServiceConnection> {
  try {
    const newConnection = await prisma.serviceConnection.create({
      data: {
        userId: data.userId,
        serviceType: data.serviceType,
        serviceAccountId: data.serviceAccountId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        connectionMetadata: data.connectionMetadata,
        connectionStatus: "ACTIVE",
      },
    });

    return newConnection;
  } catch (error) {
    throw new Error(`Failed to create connection for ${data.serviceType}.`);
  }
}

export async function updateServiceConnection(
  connectionId: string,
  data: UpdateConnectionData
): Promise<ServiceConnection> {
  try {
    const updatedConnection = await prisma.serviceConnection.update({
      where: { id: connectionId },
      data: {
        ...data,
        lastSyncAt: data.lastSyncAt || undefined,
        updatedAt: new Date(),
      },
    });

    return updatedConnection;
  } catch (error) {
    throw new Error(
      `Failed to update connection ID ${connectionId}. Connection may not exist.`
    );
  }
}

export async function getUserConnections(
  userId: string
): Promise<ServiceConnection[]> {
  try {
    const connections = await prisma.serviceConnection.findMany({
      where: {
        userId: userId,
        connectionStatus: "ACTIVE",
      },
    });
    return connections;
  } catch (error) {
    throw new Error("Failed to fetch user connections.");
  }
}

export async function deleteServiceConnection(
  connectionId: string
): Promise<boolean> {
  try {
    const deletedConnection = await prisma.serviceConnection.delete({
      where: { id: connectionId },
    });

    return !!deletedConnection;
  } catch (error) {
    throw new Error(`Failed to delete connection ID ${connectionId}.`);
  }
}

async function getGitHubOAuthToken(code: string): Promise<string> {
  const tokenUrl = "https://github.com/login/oauth/access_token";

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub token exchange failed with status: ${response.status}`
    );
  }

  const data = (await response.json()) as GitHubTokenResponse;

  if (!data.access_token) {
    throw new Error("GitHub did not return an access token.");
  }

  return data.access_token;
}

async function fetchGitHubUserProfile(
  accessToken: string
): Promise<GitHubUserResponse> {
  const userUrl = "https://api.github.com/user";

  const response = await fetch(userUrl, {
    headers: {
      Authorization: `token ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub profile fetch failed with status: ${response.status}`
    );
  }

  const userProfile = (await response.json()) as GitHubUserResponse;
  return userProfile;
}

export async function connectGitHubAccount(
  userId: string,
  code: string
): Promise<ServiceConnection> {
  const accessToken = await getGitHubOAuthToken(code);
  const userProfile = await fetchGitHubUserProfile(accessToken);

  const connectionMetadata = {
    githubUsername: userProfile.login,
    githubName: userProfile.name,
    githubEmail: userProfile.email,
    reposUrl: userProfile.repos_url,
  };

  const connectionData: CreateConnectionData = {
    userId: userId,
    serviceType: "GITHUB",
    serviceAccountId: userProfile.id.toString(),
    accessToken: accessToken,
    connectionMetadata: connectionMetadata,
  };

  const newConnection = await createServiceConnection(connectionData);

  return newConnection;
}
