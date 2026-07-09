export type NoVars = Record<string, never>;

export type ProjectsVars = {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

export type ProjectVars = { id: string };

export type StudentsVars = {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: number;
};

export type StudentVars = { id: string };

export type MeData = {
  me: {
    id: string;
    username: string;
    email: string;
    role: string;
    isVerified: boolean;
    avatar: string | null;
    createdAt: string;
  } | null;
};

export type ProjectSummary = {
  id: string;
  title: string;
  category: string;
  budget: string;
  deadline: string;
  createdAt: string;
  requiredSkills: string[];
  sme: { id: string; companyName: string; location: string; isVerified: boolean };
};

export type ProjectsData = { projects: ProjectSummary[] };

export type Milestone = { id: string; label: string; note: string; dueDate: string };

export type ProjectDetail = {
  id: string;
  title: string;
  description: string;
  descriptionExtra: string;
  category: string;
  budget: string;
  platformFee: string;
  businessTotal: string;
  deadline: string;
  status: string;
  requiredSkills: string[];
  lookingForBullets: string[];
  milestones: Milestone[];
  sme: {
    id: string;
    companyName: string;
    location: string;
    website: string;
    isVerified: boolean;
    rating: number;
    ratingCount: number;
    user: { id: string; username: string; avatar: string | null };
  };
  assignedStudent: {
    id: string;
    university: string;
    rating: number;
    user: { username: string; avatar: string | null };
  } | null;
};

export type ProjectData = { project: ProjectDetail | null };

export type SavedTaskIdsData = { savedTaskIds: string[] };
export type SavedStudentIdsData = { savedStudentIds: string[] };

export type StudentSummary = {
  id: string;
  university: string;
  major: string;
  primaryCategory: string;
  skills: string[];
  priceLow: string;
  priceHigh: string;
  availabilityStatus: string;
  availableFrom: string | null;
  rating: number;
  ratingCount: number;
  isVetted: boolean;
  user: { id: string; username: string; avatar: string | null };
};

export type StudentsData = { students: StudentSummary[] };

export type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { username: string };
};

export type StudentDetail = StudentSummary & {
  graduationYear: number;
  bio: string;
  portfolioUrl: string;
  languages: string;
  reviews: Review[];
};

export type StudentData = { student: StudentDetail | null };

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
};

export type RegisterData = { register: AuthUser };
export type RegisterVars = { username: string; email: string; password: string; role: string };

export type LoginData = { login: AuthUser };
export type LoginVars = { username: string; password: string };

export type LogoutData = { logout: boolean };

export type SaveTaskData = { saveTask: boolean };
export type UnsaveTaskData = { unsaveTask: boolean };
export type SaveTaskVars = { projectId: string };

export type SaveStudentData = { saveStudent: boolean };
export type UnsaveStudentData = { unsaveStudent: boolean };
export type SaveStudentVars = { studentId: string };

export type ReachOutData = { reachOut: { id: string; status: string } };
export type ReachOutVars = { message: string; projectId?: string; studentId?: string };

export type Attachment = {
  id: string;
  originalName: string;
  sizeBytes: number;
  url: string;
};

export type EngagementMessage = {
  id: string;
  text: string;
  createdAt: string;
  sender: { id: string; username: string };
  attachments: Attachment[];
};

export type EngagementTransaction = {
  id: string;
  status: string;
  amount: string;
  platformFee: string;
};

export type Engagement = {
  id: string;
  status: string;
  agreedPrice: string | null;
  updatedAt: string;
  project: { id: string; title: string; budget: string } | null;
  sme: { id: string; companyName: string; user: { id: string; username: string } };
  student: { id: string; user: { id: string; username: string } };
  messages: EngagementMessage[];
  transaction: EngagementTransaction | null;
  reviewerUsernames: string[];
};

export type EngagementsData = { engagements: Engagement[] };

export type SendMessageData = { sendMessage: { id: string } };
export type SendMessageVars = { engagementId: string; text: string };

export type AdvanceStatusData = { advanceEngagementStatus: { id: string; status: string } };
export type AdvanceStatusVars = { engagementId: string; status: string; agreedPrice?: string };

export type FundEscrowData = { fundEscrow: { id: string; status: string; amount: string; platformFee: string } };
export type FundEscrowVars = { engagementId: string };

export type SubmitReviewData = { submitReview: { id: string; rating: number } };
export type SubmitReviewVars = { engagementId: string; rating: number; comment?: string };

export type WalletMonth = { label: string; value: string };

export type WalletStats = {
  thisMonthTotal: string;
  escrowHeld: string;
  activeTotal: string;
  activeCount: number;
  feesThisMonth: string;
  months: WalletMonth[];
};

export type WalletStatsData = { walletStats: WalletStats };
