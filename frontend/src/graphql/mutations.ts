import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AdvanceStatusData,
  AdvanceStatusVars,
  FundEscrowData,
  FundEscrowVars,
  LoginData,
  LoginVars,
  LogoutData,
  NoVars,
  ReachOutData,
  ReachOutVars,
  RegisterData,
  RegisterVars,
  SaveStudentData,
  SaveStudentVars,
  SaveTaskData,
  SaveTaskVars,
  SendMessageData,
  SendMessageVars,
  SubmitReviewData,
  SubmitReviewVars,
  UnsaveStudentData,
  UnsaveTaskData,
} from "./types";

export const REGISTER: TypedDocumentNode<RegisterData, RegisterVars> = gql`
  mutation Register(
    $username: String!
    $email: String!
    $password: String!
    $role: String!
  ) {
    register(
      username: $username
      email: $email
      password: $password
      role: $role
    ) {
      id
      username
      email
      role
      isVerified
    }
  }
`;

export const LOGIN: TypedDocumentNode<LoginData, LoginVars> = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      id
      username
      email
      role
      isVerified
    }
  }
`;

export const LOGOUT: TypedDocumentNode<LogoutData, NoVars> = gql`
  mutation Logout {
    logout
  }
`;

export const SAVE_TASK: TypedDocumentNode<SaveTaskData, SaveTaskVars> = gql`
  mutation SaveTask($projectId: ID!) {
    saveTask(projectId: $projectId)
  }
`;

export const UNSAVE_TASK: TypedDocumentNode<UnsaveTaskData, SaveTaskVars> = gql`
  mutation UnsaveTask($projectId: ID!) {
    unsaveTask(projectId: $projectId)
  }
`;

export const SAVE_STUDENT: TypedDocumentNode<SaveStudentData, SaveStudentVars> = gql`
  mutation SaveStudent($studentId: ID!) {
    saveStudent(studentId: $studentId)
  }
`;

export const UNSAVE_STUDENT: TypedDocumentNode<UnsaveStudentData, SaveStudentVars> = gql`
  mutation UnsaveStudent($studentId: ID!) {
    unsaveStudent(studentId: $studentId)
  }
`;

export const REACH_OUT: TypedDocumentNode<ReachOutData, ReachOutVars> = gql`
  mutation ReachOut($message: String!, $projectId: ID, $studentId: ID) {
    reachOut(message: $message, projectId: $projectId, studentId: $studentId) {
      id
      status
    }
  }
`;

export const SEND_MESSAGE: TypedDocumentNode<SendMessageData, SendMessageVars> = gql`
  mutation SendMessage($engagementId: ID!, $text: String!) {
    sendMessage(engagementId: $engagementId, text: $text) {
      id
    }
  }
`;

export const ADVANCE_ENGAGEMENT_STATUS: TypedDocumentNode<AdvanceStatusData, AdvanceStatusVars> = gql`
  mutation AdvanceEngagementStatus($engagementId: ID!, $status: String!, $agreedPrice: String) {
    advanceEngagementStatus(engagementId: $engagementId, status: $status, agreedPrice: $agreedPrice) {
      id
      status
    }
  }
`;

export const FUND_ESCROW: TypedDocumentNode<FundEscrowData, FundEscrowVars> = gql`
  mutation FundEscrow($engagementId: ID!) {
    fundEscrow(engagementId: $engagementId) {
      id
      status
      amount
      platformFee
    }
  }
`;

export const SUBMIT_REVIEW: TypedDocumentNode<SubmitReviewData, SubmitReviewVars> = gql`
  mutation SubmitReview($engagementId: ID!, $rating: Int!, $comment: String) {
    submitReview(engagementId: $engagementId, rating: $rating, comment: $comment) {
      id
      rating
    }
  }
`;
