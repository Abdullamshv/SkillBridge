import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
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
