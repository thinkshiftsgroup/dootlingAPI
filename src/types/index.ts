export type ContributorUpdateItem = {
  id?: string;
  userId?: string;
  action: "create" | "update" | "delete";
  role?: string;
  budgetPercentage?: number;
  releasePercentage?: number;
};

export type ManageEscrowProjectInput = {
  projectId: string;
  title?: string;
  description?: string;
  isPublic?: boolean;
  totalBudget?: number;
  startDate?: Date;
  deliveryDate?: Date;
  contractClauses?: string;
  fundsRule?: boolean;
  receiveEmailNotifications?: boolean;
  isDeleted?: boolean;
  contributors?: ContributorUpdateItem[];
};
