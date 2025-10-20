import { Request, Response } from "express";
import { connectGitHubAccount } from "@services/serviceConnection.service";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
const GITHUB_SCOPE = "repo user:email";

const redirectToAuth = (req: Request, res: Response) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_REDIRECT_URI) {
    return res
      .status(500)
      .json({ message: "GitHub environment variables not configured." });
  }

  const githubAuthUrl =
    `https://github.com/login/oauth/authorize?` +
    `client_id=${GITHUB_CLIENT_ID}` +
    `&redirect_uri=${GITHUB_REDIRECT_URI}` +
    `&scope=${GITHUB_SCOPE}`;

  res.redirect(githubAuthUrl);
};

const handleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const userId = (req as any).userId as string;

  if (!code) {
    return res
      .status(400)
      .json({ message: "Authorization code not received from GitHub." });
  }

  try {
    const newConnection = await connectGitHubAccount(userId, code);

    return res.status(200).json({
      message: "GitHub account connected successfully.",
      serviceConnectionId: newConnection.id,
      serviceType: newConnection.serviceType,
    });
  } catch (error) {
    console.error("GitHub Connection Error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during connection.";

    return res.status(500).json({
      message: "Failed to connect GitHub account.",
      error: errorMessage,
    });
  }
};

export const githubController = {
  redirectToAuth,
  handleCallback,
};
