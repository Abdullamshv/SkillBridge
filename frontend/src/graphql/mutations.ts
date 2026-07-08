import { gql } from "@apollo/client";

export const REGISTER = gql`
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

export const LOGIN = gql`
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

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const SAVE_TASK = gql`
  mutation SaveTask($projectId: ID!) {
    saveTask(projectId: $projectId)
  }
`;

export const UNSAVE_TASK = gql`
  mutation UnsaveTask($projectId: ID!) {
    unsaveTask(projectId: $projectId)
  }
`;

export const SAVE_STUDENT = gql`
  mutation SaveStudent($studentId: ID!) {
    saveStudent(studentId: $studentId)
  }
`;

export const UNSAVE_STUDENT = gql`
  mutation UnsaveStudent($studentId: ID!) {
    unsaveStudent(studentId: $studentId)
  }
`;

export const REACH_OUT = gql`
  mutation ReachOut($message: String!, $projectId: ID, $studentId: ID) {
    reachOut(message: $message, projectId: $projectId, studentId: $studentId) {
      id
      status
    }
  }
`;
